"""Repository layer for Claim and Remittance database queries.

Encapsulates SQL queries, eager loading (selectinload), and pagination.
"""

from typing import List, Optional, Tuple
from sqlalchemy import case, func
from sqlalchemy.orm import Session, selectinload

from backend.app.db.models import Claim, Remittance
from backend.app.schemas.claim import (
    ClaimDetail,
    ClaimListItem,
    RemittanceDetail,
)
from backend.app.schemas.remittance import UnmatchedRemittanceItem
from backend.app.schemas.summary import ReconciliationSummary
from backend.app.services.export_service import (
    generate_reconciliation_csv,
    generate_reconciliation_json,
)
from backend.app.services.reconciliation import (
    ASSIGNMENT_DENIAL_CODES,
    calculate_claim_reconciliation,
)


class ClaimRepository:
    """Encapsulates database access for claims and remittances."""

    def __init__(self, db: Session):
        self.db = db

    # -------------------------------------------------------------------------
    # Private Helper Queries for Summary Aggregations
    # -------------------------------------------------------------------------

    def _get_claim_totals(self) -> Tuple[int, int]:
        """Fetch (total_claims_count, total_billed_cents) in a single fast query."""
        agg = self.db.query(
            func.count(Claim.claim_id),
            func.coalesce(func.sum(Claim.billed_cents), 0),
        ).first()
        total_claims = agg[0] if agg else 0
        total_billed = agg[1] if agg else 0
        return total_claims, total_billed

    def _get_remittance_aggregates(self) -> Tuple[int, int, int, int, int, int]:
        """Fetch aggregate totals across remittances in a single pass."""
        agg = self.db.query(
            func.coalesce(func.sum(Remittance.paid_cents), 0),
            func.coalesce(
                func.sum(
                    case((Remittance.claim_id.isnot(None), Remittance.paid_cents), else_=0)
                ),
                0,
            ),
            func.coalesce(
                func.sum(
                    case((Remittance.claim_id.is_(None), 1), else_=0)
                ),
                0,
            ),
            func.coalesce(
                func.sum(
                    case((Remittance.claim_id.is_(None), Remittance.paid_cents), else_=0)
                ),
                0,
            ),
            func.coalesce(
                func.sum(
                    case((Remittance.claim_id.isnot(None), Remittance.adjustment_cents), else_=0)
                ),
                0,
            ),
            func.coalesce(
                func.sum(
                    case((Remittance.claim_id.isnot(None), Remittance.patient_responsibility_cents), else_=0)
                ),
                0,
            ),
        ).first()

        if not agg:
            return 0, 0, 0, 0, 0, 0
        return agg[0], agg[1], agg[2], agg[3], agg[4], agg[5]

    def _calculate_claim_breakdown(self, claims: List[Claim]) -> Tuple[int, int, int, int, int]:
        """Count claims by reconciliation status and review flags."""
        balanced = 0
        unbalanced = 0
        no_remittance = 0
        denial_history = 0
        flagged_for_review = 0

        for claim in claims:
            matched_remits = [r for r in claim.remittances if r.claim_id == claim.claim_id]
            _, status, flags, has_denial = calculate_claim_reconciliation(
                billed_cents=claim.billed_cents,
                matched_remittances=matched_remits,
                claim_payer=claim.payer,
            )

            if status == "balanced":
                balanced += 1
            elif status == "unbalanced":
                unbalanced += 1
            elif status == "no_remittance":
                no_remittance += 1

            if has_denial:
                denial_history += 1

            if "payment_exceeds_billed" in flags or "payer_mismatch" in flags:
                flagged_for_review += 1

        return balanced, unbalanced, no_remittance, denial_history, flagged_for_review

    # -------------------------------------------------------------------------
    # Public Query Methods
    # -------------------------------------------------------------------------

    def get_summary(self) -> ReconciliationSummary:
        """Compute aggregate reconciliation summary KPIs across all records."""
        total_claims, total_billed_cents = self._get_claim_totals()
        (
            all_remittance_paid_cents,
            matched_paid_cents,
            unmatched_count,
            unmatched_paid_cents,
            total_adjustment_cents,
            total_patient_responsibility_cents,
        ) = self._get_remittance_aggregates()

        uncollected_cash_cents = max(0, total_billed_cents - matched_paid_cents)
        net_unsettled_cents = max(
            0,
            total_billed_cents
            - matched_paid_cents
            - total_adjustment_cents
            - total_patient_responsibility_cents,
        )

        # Load all claims with remittances to evaluate claim-level reconciliation statuses
        all_claims = self.db.query(Claim).options(selectinload(Claim.remittances)).all()
        (
            balanced_count,
            unbalanced_count,
            no_remittance_count,
            denial_history_count,
            flagged_for_review_count,
        ) = self._calculate_claim_breakdown(all_claims)

        return ReconciliationSummary(
            total_claims=total_claims,
            balanced_claims=balanced_count,
            unbalanced_claims=unbalanced_count,
            claims_without_remittance=no_remittance_count,
            total_billed_cents=total_billed_cents,
            matched_paid_cents=matched_paid_cents,
            all_remittance_paid_cents=all_remittance_paid_cents,
            unmatched_remittance_count=unmatched_count,
            unmatched_remittance_paid_cents=unmatched_paid_cents,
            claims_with_denial_history=denial_history_count,
            claims_flagged_for_review=flagged_for_review_count,
            uncollected_cash_cents=uncollected_cash_cents,
            net_unsettled_cents=net_unsettled_cents,
            total_adjustment_cents=total_adjustment_cents,
            total_patient_responsibility_cents=total_patient_responsibility_cents,
        )

    def get_claims_paginated(
        self,
        payer: Optional[str] = None,
        status: Optional[str] = None,
        claim_id: Optional[str] = None,
        flag: Optional[str] = None,
        page: int = 1,
        page_size: int = 10,
    ) -> Tuple[List[ClaimListItem], int]:
        """Query claims with eager-loaded remittances, filtering, and pagination."""
        query = self.db.query(Claim).options(selectinload(Claim.remittances))

        if claim_id:
            search_term = f"%{claim_id.strip()}%"
            query = query.filter(
                Claim.claim_id.ilike(search_term) | Claim.patient_account.ilike(search_term)
            )

        if payer:
            query = query.filter(func.lower(Claim.payer) == payer.strip().lower())

        # Sort claims deterministically by claim_id ascending
        query = query.order_by(Claim.claim_id.asc())
        all_claims = query.all()

        calculated_items: List[ClaimListItem] = []
        for claim in all_claims:
            matched_remits = [r for r in claim.remittances if r.claim_id == claim.claim_id]
            totals, claim_status, flags, _ = calculate_claim_reconciliation(
                billed_cents=claim.billed_cents,
                matched_remittances=matched_remits,
                claim_payer=claim.payer,
            )

            if status and claim_status != status.strip().lower():
                continue

            if flag and flag.strip().lower() not in [f.lower() for f in flags]:
                continue

            calculated_items.append(
                ClaimListItem(
                    claim_id=claim.claim_id,
                    payer=claim.payer,
                    billed_cents=claim.billed_cents,
                    paid_cents=totals.paid_cents,
                    adjustment_cents=totals.adjustment_cents,
                    patient_responsibility_cents=totals.patient_responsibility_cents,
                    difference_cents=totals.difference_cents,
                    status=claim_status,
                    flags=flags,
                )
            )

        total_count = len(calculated_items)
        start_idx = (page - 1) * page_size
        end_idx = start_idx + page_size
        paged_items = calculated_items[start_idx:end_idx]

        return paged_items, total_count

    def get_claim_by_id(self, claim_id: str) -> Optional[ClaimDetail]:
        """Fetch full claim details including complete ordered remittance history."""
        norm_id = claim_id.strip().upper()
        claim = (
            self.db.query(Claim)
            .options(selectinload(Claim.remittances))
            .filter(Claim.claim_id == norm_id)
            .first()
        )
        if not claim:
            return None

        matched_remits = [r for r in claim.remittances if r.claim_id == claim.claim_id]
        totals, status, flags, has_denial = calculate_claim_reconciliation(
            billed_cents=claim.billed_cents,
            matched_remittances=matched_remits,
            claim_payer=claim.payer,
        )

        sorted_remits = sorted(matched_remits, key=lambda x: (x.posted_date, x.remit_id))
        remit_details: List[RemittanceDetail] = [
            RemittanceDetail(
                remit_id=r.remit_id,
                paid_cents=r.paid_cents,
                adjustment_cents=r.adjustment_cents,
                patient_responsibility_cents=r.patient_responsibility_cents,
                reason_code=r.reason_code,
                posted_date=r.posted_date,
            )
            for r in sorted_remits
        ]

        return ClaimDetail(
            claim_id=claim.claim_id,
            patient_account=claim.patient_account,
            payer=claim.payer,
            service_date=claim.service_date,
            cpt=claim.cpt,
            billed_cents=claim.billed_cents,
            totals=totals,
            status=status,
            flags=flags,
            denial_history=has_denial,
            remittances=remit_details,
        )

    def get_unmatched_remittances(self) -> List[UnmatchedRemittanceItem]:
        """Fetch all orphaned remittances whose referenced claim_id is NULL."""
        records = (
            self.db.query(Remittance)
            .filter(Remittance.claim_id.is_(None))
            .order_by(Remittance.posted_date.asc(), Remittance.remit_id.asc())
            .all()
        )

        return [
            UnmatchedRemittanceItem(
                remit_id=r.remit_id,
                source_claim_id=r.source_claim_id,
                payer=r.payer,
                paid_cents=r.paid_cents,
                adjustment_cents=r.adjustment_cents,
                patient_responsibility_cents=r.patient_responsibility_cents,
                reason_code=r.reason_code,
                posted_date=r.posted_date,
                issue="claim_not_found",
            )
            for r in records
        ]

    def get_all_claims_for_export(self) -> List[Claim]:
        """Fetch all claims eagerly loaded for audit file generation."""
        return (
            self.db.query(Claim)
            .options(selectinload(Claim.remittances))
            .order_by(Claim.claim_id.asc())
            .all()
        )

    def export_reconciliation_csv(self) -> str:
        """Generate complete reconciliation audit ledger as CSV formatted string."""
        claims = self.get_all_claims_for_export()
        return generate_reconciliation_csv(claims)

    def export_reconciliation_json(self) -> str:
        """Generate complete reconciliation audit ledger as formatted JSON string."""
        claims = self.get_all_claims_for_export()
        return generate_reconciliation_json(claims)
