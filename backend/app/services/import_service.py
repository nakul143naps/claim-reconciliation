"""CSV Import Service for Claims and Remittances.

Handles validation, atomic row-level savepoints (begin_nested), duplicate detection,
and bi-directional orphan remittance auto-relinking per RULES.md.
"""

import csv
import io
from datetime import date, datetime
from pathlib import Path
from typing import Dict, List, Optional, Set, Tuple, Union
from sqlalchemy.orm import Session

from backend.app.db.models import Claim, Remittance
from backend.app.schemas.import_report import FileImportResult, FullImportReport, RowIssue

EXPECTED_CLAIM_HEADERS: Set[str] = {
    "claim_id",
    "patient_account",
    "payer",
    "service_date",
    "cpt",
    "billed_cents",
}

EXPECTED_REMITTANCE_HEADERS: Set[str] = {
    "remit_id",
    "claim_id",
    "payer",
    "paid_cents",
    "adjustment_cents",
    "patient_responsibility_cents",
    "reason_code",
    "posted_date",
}


class CSVHeaderError(Exception):
    """Raised when CSV headers are missing required columns."""
    pass


# -----------------------------------------------------------------------------
# Field Parsing Helpers
# -----------------------------------------------------------------------------

def parse_iso_date(value: str, field_name: str) -> date:
    """Parse strict ISO YYYY-MM-DD date."""
    trimmed = value.strip()
    if not trimmed:
        raise ValueError(f"{field_name} date is required and cannot be empty")
    try:
        return datetime.strptime(trimmed, "%Y-%m-%d").date()
    except ValueError:
        raise ValueError(f"{field_name} must be a valid date in strict YYYY-MM-DD format (got '{value}')")


def parse_cents(value: str, field_name: str) -> int:
    """Parse and validate nonnegative integer cents."""
    trimmed = value.strip()
    if not trimmed:
        raise ValueError(f"{field_name} is required and cannot be empty")

    if "." in trimmed:
        raise ValueError(f"{field_name} must be integer cents, fractional cents not allowed (got '{value}')")

    try:
        cents = int(trimmed)
    except ValueError:
        raise ValueError(f"{field_name} must be a valid integer representing cents (got '{value}')")

    if cents < 0:
        raise ValueError(f"{field_name} cannot be negative; reversals deferred in v1 (got '{value}')")

    return cents


def parse_clean_string(value: str, field_name: str, allow_empty: bool = False) -> Optional[str]:
    """Trim string and enforce non-empty presence unless allowed."""
    trimmed = value.strip()
    if not trimmed:
        if allow_empty:
            return None
        raise ValueError(f"{field_name} is required and cannot be empty")
    return trimmed


# -----------------------------------------------------------------------------
# Main Import Service
# -----------------------------------------------------------------------------

class ImportService:
    """Orchestrates CSV parsing, atomic persistence, and orphan re-linking."""

    def __init__(self, db: Session):
        self.db = db

    # -------------------------------------------------------------------------
    # Shared Validation & Reporting Helpers
    # -------------------------------------------------------------------------

    @staticmethod
    def _validate_headers(fieldnames: Optional[List[str]], expected: Set[str], label: str) -> None:
        """Enforce presence of required CSV headers."""
        if not fieldnames:
            raise CSVHeaderError(f"{label} CSV file is empty or missing header row")
        found = {h.strip() for h in fieldnames if h}
        missing = expected - found
        if missing:
            raise CSVHeaderError(f"{label} CSV missing required header(s): {', '.join(sorted(missing))}")

    @staticmethod
    def _record_issue(
        result: FileImportResult,
        row_num: int,
        record_id: Optional[str],
        code: str,
        message: str,
        is_conflict: bool = False,
    ) -> None:
        """Record a validation or database error in the import report."""
        result.rejected += 1
        if is_conflict:
            result.conflicting_existing_id += 1
        result.issues.append(
            RowIssue(row_number=row_num, record_id=record_id, code=code, message=message)
        )

    def _relink_orphan_remittances(self, new_claim_ids: List[str]) -> None:
        """Auto-link any waiting orphaned remittances whose claim was just imported."""
        if not new_claim_ids:
            return
        waiting = (
            self.db.query(Remittance)
            .filter(Remittance.claim_id.is_(None), Remittance.source_claim_id.in_(new_claim_ids))
            .all()
        )
        for remit in waiting:
            remit.claim_id = remit.source_claim_id

    # -------------------------------------------------------------------------
    # Claims Ingestion
    # -------------------------------------------------------------------------

    def import_claims_csv(self, file_path: Union[str, Path]) -> FileImportResult:
        """Import claims from a CSV file path."""
        path = Path(file_path)
        if not path.exists():
            raise FileNotFoundError(f"Claims CSV file not found: {path}")
        with path.open("r", encoding="utf-8-sig") as handle:
            return self._import_claims_from_handle(handle, filename=path.name)

    def import_claims_content(self, content: str, filename: str = "uploaded_claims.csv") -> FileImportResult:
        """Import claims from in-memory string content."""
        return self._import_claims_from_handle(io.StringIO(content), filename=filename)

    def _parse_claim_row(self, row: Dict[str, str]) -> Claim:
        """Parse and validate a single claim CSV row."""
        return Claim(
            claim_id=parse_clean_string(row.get("claim_id", ""), "claim_id"),
            patient_account=parse_clean_string(row.get("patient_account", ""), "patient_account"),
            payer=parse_clean_string(row.get("payer", ""), "payer"),
            service_date=parse_iso_date(row.get("service_date", ""), "service_date"),
            cpt=parse_clean_string(row.get("cpt", ""), "cpt"),
            billed_cents=parse_cents(row.get("billed_cents", ""), "billed_cents"),
        )

    def _handle_claim_duplicate(
        self, candidate: Claim, seen: Dict[str, Claim], result: FileImportResult, row_num: int
    ) -> bool:
        """Check duplicate within batch or database. Returns True if row should be inserted."""
        cid = candidate.claim_id

        # 1. Check within this batch
        if cid in seen:
            if self._is_identical_claim(seen[cid], candidate):
                result.duplicate_noop += 1
            else:
                self._record_issue(
                    result, row_num, cid, "CONFLICTING_DUPLICATE_ID",
                    f"Claim ID '{cid}' repeats in file with conflicting data", is_conflict=True,
                )
            return False

        # 2. Check in database
        existing = self.db.query(Claim).filter(Claim.claim_id == cid).first()
        if existing:
            if self._is_identical_claim(existing, candidate):
                result.duplicate_noop += 1
                seen[cid] = existing
            else:
                self._record_issue(
                    result, row_num, cid, "CONFLICTING_EXISTING_ID",
                    f"Claim ID '{cid}' already exists in database with different data", is_conflict=True,
                )
            return False

        return True

    def _import_claims_from_handle(self, handle, filename: str) -> FileImportResult:
        """Parse and insert claim records with row-level savepoints."""
        result = FileImportResult(filename=filename)
        reader = csv.DictReader(handle)
        self._validate_headers(reader.fieldnames, EXPECTED_CLAIM_HEADERS, "Claims")

        seen_in_batch: Dict[str, Claim] = {}

        for row_idx, row in enumerate(reader, start=2):
            result.rows_seen += 1
            raw_id = row.get("claim_id", "").strip() or None

            try:
                candidate = self._parse_claim_row(row)
                if not self._handle_claim_duplicate(candidate, seen_in_batch, result, row_idx):
                    continue

                with self.db.begin_nested():
                    self.db.add(candidate)
                    self.db.flush()

                seen_in_batch[candidate.claim_id] = candidate
                result.inserted += 1

            except ValueError as ve:
                self._record_issue(result, row_idx, raw_id, "VALIDATION_ERROR", str(ve))
            except Exception as e:
                self._record_issue(result, row_idx, raw_id, "DATABASE_ERROR", f"Unexpected error: {e}")

        # Auto-link any waiting orphan remittances
        self._relink_orphan_remittances(list(seen_in_batch.keys()))
        self.db.commit()
        return result

    # -------------------------------------------------------------------------
    # Remittances Ingestion
    # -------------------------------------------------------------------------

    def import_remittances_csv(self, file_path: Union[str, Path]) -> FileImportResult:
        """Import remittances from a CSV file path."""
        path = Path(file_path)
        if not path.exists():
            raise FileNotFoundError(f"Remittances CSV file not found: {path}")
        with path.open("r", encoding="utf-8-sig") as handle:
            return self._import_remittances_from_handle(handle, filename=path.name)

    def import_remittances_content(self, content: str, filename: str = "uploaded_remittances.csv") -> FileImportResult:
        """Import remittances from in-memory string content."""
        return self._import_remittances_from_handle(io.StringIO(content), filename=filename)

    def _parse_remittance_row(self, row: Dict[str, str], known_claim_ids: Set[str]) -> Tuple[Remittance, Optional[str]]:
        """Parse and validate a single remittance CSV row, determining initial link."""
        source_claim_id = parse_clean_string(row.get("claim_id", ""), "claim_id")
        linked_claim_id = source_claim_id if source_claim_id in known_claim_ids else None

        candidate = Remittance(
            remit_id=parse_clean_string(row.get("remit_id", ""), "remit_id"),
            source_claim_id=source_claim_id,
            claim_id=linked_claim_id,
            payer=parse_clean_string(row.get("payer", ""), "payer"),
            paid_cents=parse_cents(row.get("paid_cents", ""), "paid_cents"),
            adjustment_cents=parse_cents(row.get("adjustment_cents", ""), "adjustment_cents"),
            patient_responsibility_cents=parse_cents(
                row.get("patient_responsibility_cents", ""), "patient_responsibility_cents"
            ),
            reason_code=parse_clean_string(row.get("reason_code", ""), "reason_code", allow_empty=True),
            posted_date=parse_iso_date(row.get("posted_date", ""), "posted_date"),
        )
        return candidate, linked_claim_id

    def _handle_remittance_duplicate(
        self,
        candidate: Remittance,
        seen: Dict[str, Remittance],
        linked_claim_id: Optional[str],
        result: FileImportResult,
        row_num: int,
    ) -> bool:
        """Check duplicate within batch or database. Returns True if row should be inserted."""
        rid = candidate.remit_id

        # 1. Check within this batch
        if rid in seen:
            if self._is_identical_remittance(seen[rid], candidate):
                result.duplicate_noop += 1
            else:
                self._record_issue(
                    result, row_num, rid, "CONFLICTING_DUPLICATE_ID",
                    f"Remittance ID '{rid}' repeats in file with conflicting data", is_conflict=True,
                )
            return False

        # 2. Check in database
        existing = self.db.query(Remittance).filter(Remittance.remit_id == rid).first()
        if existing:
            # If previously orphaned but now matches a claim, link it
            if existing.claim_id is None and linked_claim_id is not None:
                existing.claim_id = linked_claim_id
                result.inserted += 1
                seen[rid] = existing
            elif self._is_identical_remittance(existing, candidate):
                result.duplicate_noop += 1
                seen[rid] = existing
            else:
                self._record_issue(
                    result, row_num, rid, "CONFLICTING_EXISTING_ID",
                    f"Remittance ID '{rid}' already exists in database with different data", is_conflict=True,
                )
            return False

        return True

    def _import_remittances_from_handle(self, handle, filename: str) -> FileImportResult:
        """Parse and insert remittance records with row-level savepoints."""
        result = FileImportResult(filename=filename)
        reader = csv.DictReader(handle)
        self._validate_headers(reader.fieldnames, EXPECTED_REMITTANCE_HEADERS, "Remittances")

        known_claim_ids: Set[str] = {c.claim_id for c in self.db.query(Claim.claim_id).all()}
        seen_in_batch: Dict[str, Remittance] = {}

        for row_idx, row in enumerate(reader, start=2):
            result.rows_seen += 1
            raw_id = row.get("remit_id", "").strip() or None

            try:
                candidate, linked_id = self._parse_remittance_row(row, known_claim_ids)
                if not self._handle_remittance_duplicate(candidate, seen_in_batch, linked_id, result, row_idx):
                    continue

                with self.db.begin_nested():
                    self.db.add(candidate)
                    self.db.flush()

                seen_in_batch[candidate.remit_id] = candidate
                result.inserted += 1

            except ValueError as ve:
                self._record_issue(result, row_idx, raw_id, "VALIDATION_ERROR", str(ve))
            except Exception as e:
                self._record_issue(result, row_idx, raw_id, "DATABASE_ERROR", f"Unexpected error: {e}")

        self.db.commit()
        return result

    # -------------------------------------------------------------------------
    # Full Pipeline & Benchmark Reset
    # -------------------------------------------------------------------------

    def import_all(
        self,
        claims_path: Union[str, Path],
        remittances_path: Union[str, Path],
    ) -> FullImportReport:
        """Run complete import pipeline: claims first, then remittances."""
        claims_result = self.import_claims_csv(claims_path)
        remittances_result = self.import_remittances_csv(remittances_path)
        return FullImportReport(
            claims=claims_result,
            remittances=remittances_result,
            success=True,
        )

    def reset_benchmark_data(self) -> FullImportReport:
        """Wipe database and cleanly reload canonical 12 claims and 13 remittances benchmark."""
        self.db.query(Remittance).delete()
        self.db.query(Claim).delete()
        self.db.commit()

        project_root = Path(__file__).resolve().parents[3]
        claims_file = project_root / "data" / "claims.csv"
        remits_file = project_root / "data" / "remittances.csv"

        claims_res = self.import_claims_csv(claims_file)
        remits_res = self.import_remittances_csv(remits_file)

        return FullImportReport(
            claims=claims_res,
            remittances=remits_res,
            success=True,
        )

    # -------------------------------------------------------------------------
    # Identity Equality Checkers
    # -------------------------------------------------------------------------

    @staticmethod
    def _is_identical_claim(a: Claim, b: Claim) -> bool:
        return (
            a.claim_id == b.claim_id
            and a.patient_account == b.patient_account
            and a.payer == b.payer
            and a.service_date == b.service_date
            and a.cpt == b.cpt
            and a.billed_cents == b.billed_cents
        )

    @staticmethod
    def _is_identical_remittance(a: Remittance, b: Remittance) -> bool:
        return (
            a.remit_id == b.remit_id
            and a.source_claim_id == b.source_claim_id
            and a.payer == b.payer
            and a.paid_cents == b.paid_cents
            and a.adjustment_cents == b.adjustment_cents
            and a.patient_responsibility_cents == b.patient_responsibility_cents
            and a.reason_code == b.reason_code
            and a.posted_date == b.posted_date
        )
