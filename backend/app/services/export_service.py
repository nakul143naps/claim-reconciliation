"""Export Service for generating formatted reconciliation audit files (CSV and JSON).

Keeps file serialization decoupled from database repository logic.
"""

import csv
import io
import json
from datetime import datetime, timezone
from typing import List

from backend.app.db.models import Claim
from backend.app.services.reconciliation import calculate_claim_reconciliation


def generate_reconciliation_csv(claims: List[Claim]) -> str:
    """Generate complete reconciliation audit ledger as formatted CSV string."""
    output = io.StringIO()
    writer = csv.writer(output, lineterminator="\n")

    writer.writerow([
        "claim_id",
        "patient_account",
        "payer",
        "service_date",
        "cpt",
        "billed_cents",
        "paid_cents",
        "adjustment_cents",
        "patient_responsibility_cents",
        "difference_cents",
        "status",
        "flags",
        "matched_remittances_count",
    ])

    for claim in claims:
        matched_remits = [r for r in claim.remittances if r.claim_id == claim.claim_id]
        totals, status, flags, _ = calculate_claim_reconciliation(
            billed_cents=claim.billed_cents,
            matched_remittances=matched_remits,
            claim_payer=claim.payer,
        )

        diff_str = str(totals.difference_cents) if totals.difference_cents is not None else ""
        flags_str = ";".join(flags) if flags else "none"

        writer.writerow([
            claim.claim_id,
            claim.patient_account,
            claim.payer,
            claim.service_date.isoformat(),
            claim.cpt,
            claim.billed_cents,
            totals.paid_cents,
            totals.adjustment_cents,
            totals.patient_responsibility_cents,
            diff_str,
            status,
            flags_str,
            len(matched_remits),
        ])

    return output.getvalue()


def generate_reconciliation_json(claims: List[Claim]) -> str:
    """Generate complete reconciliation audit ledger as formatted JSON string."""
    records = []
    for claim in claims:
        matched_remits = [r for r in claim.remittances if r.claim_id == claim.claim_id]
        totals, status, flags, _ = calculate_claim_reconciliation(
            billed_cents=claim.billed_cents,
            matched_remittances=matched_remits,
            claim_payer=claim.payer,
        )

        records.append({
            "claim_id": claim.claim_id,
            "patient_account": claim.patient_account,
            "payer": claim.payer,
            "service_date": claim.service_date.isoformat(),
            "cpt": claim.cpt,
            "billed_cents": claim.billed_cents,
            "billed_dollars": f"{(claim.billed_cents / 100):.2f}",
            "paid_cents": totals.paid_cents,
            "paid_dollars": f"{(totals.paid_cents / 100):.2f}",
            "adjustment_cents": totals.adjustment_cents,
            "adjustment_dollars": f"{(totals.adjustment_cents / 100):.2f}",
            "patient_responsibility_cents": totals.patient_responsibility_cents,
            "patient_responsibility_dollars": f"{(totals.patient_responsibility_cents / 100):.2f}",
            "difference_cents": totals.difference_cents,
            "difference_dollars": f"{(totals.difference_cents / 100):.2f}" if totals.difference_cents is not None else None,
            "status": status,
            "flags": flags,
            "matched_remittances_count": len(matched_remits),
        })

    return json.dumps({
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "total_records": len(records),
        "claims": records,
    }, default=str, indent=2)
