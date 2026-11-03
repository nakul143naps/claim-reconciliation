"""Endpoints for prospective customer demo intake and lead management."""

import csv
import io
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session

from backend.app.db.models import DemoRequest
from backend.app.db.session import get_db
from backend.app.schemas.demo import (
    DemoRequestCreate,
    DemoRequestItem,
    DemoRequestListResponse,
    DemoRequestResponse,
)

router = APIRouter(prefix="/demo", tags=["Demo Requests & Leads"])


@router.post(
    "/request",
    response_model=DemoRequestResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Submit a customer demo request",
)
def create_demo_request(
    payload: DemoRequestCreate,
    db: Session = Depends(get_db),
) -> DemoRequestResponse:
    """Store prospective customer contact details in the database."""
    lead = DemoRequest(
        full_name=payload.full_name.strip(),
        work_email=payload.work_email.strip().lower(),
        organization=payload.organization.strip() if payload.organization else None,
        phone=payload.phone.strip() if payload.phone else None,
        claim_volume=payload.claim_volume.strip() if payload.claim_volume else None,
        notes=payload.notes.strip() if payload.notes else None,
    )
    db.add(lead)
    db.commit()
    db.refresh(lead)

    return DemoRequestResponse(
        success=True,
        message="Demo request submitted and saved successfully",
        id=lead.id,
    )


@router.get(
    "/requests",
    response_model=DemoRequestListResponse,
    summary="Retrieve all customer demo requests",
)
def list_demo_requests(db: Session = Depends(get_db)) -> DemoRequestListResponse:
    """List all submitted customer leads in reverse chronological order."""
    leads = db.query(DemoRequest).order_by(DemoRequest.created_at.desc()).all()
    items = [
        DemoRequestItem(
            id=lead.id,
            full_name=lead.full_name,
            work_email=lead.work_email,
            organization=lead.organization,
            phone=lead.phone,
            claim_volume=lead.claim_volume,
            notes=lead.notes,
            created_at=lead.created_at,
        )
        for lead in leads
    ]
    return DemoRequestListResponse(items=items, total=len(items))


@router.get(
    "/requests/export",
    response_class=Response,
    summary="Export all customer leads to CSV",
)
def export_demo_requests(db: Session = Depends(get_db)) -> Response:
    """Export all demo inquiries into a downloadable CSV spreadsheet."""
    leads = db.query(DemoRequest).order_by(DemoRequest.created_at.desc()).all()

    output = io.StringIO()
    writer = csv.writer(output, lineterminator="\n")
    writer.writerow([
        "id",
        "full_name",
        "work_email",
        "organization",
        "phone",
        "claim_volume",
        "notes",
        "submitted_at_utc",
    ])

    for lead in leads:
        writer.writerow([
            lead.id,
            lead.full_name,
            lead.work_email,
            lead.organization or "",
            lead.phone or "",
            lead.claim_volume or "",
            lead.notes or "",
            lead.created_at.isoformat() if lead.created_at else "",
        ])

    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=demo_requests_leads.csv"},
    )
