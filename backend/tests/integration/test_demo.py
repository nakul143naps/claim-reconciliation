"""Integration tests for customer demo requests & lead intake."""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from backend.app.db.models import DemoRequest
from backend.app.db.session import get_db
from backend.app.main import app


@pytest.fixture(scope="function")
def client(db_session: Session) -> TestClient:
    """FastAPI TestClient with overridden get_db dependency pointing to test session."""
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


def test_create_demo_request(client: TestClient, db_session: Session):
    """POST /api/demo/request successfully records a new customer lead."""
    payload = {
        "full_name": "Dr. Sarah Jenkins",
        "work_email": "s.jenkins@metrohealth.org",
        "organization": "Metro Health Clinic",
        "phone": "+1 (555) 234-5678",
        "claim_volume": "10,000 – 25,000 claims/mo",
        "notes": "Interested in automated CARC denial resolution.",
    }
    response = client.post("/api/demo/request", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["success"] is True
    assert "id" in data

    # Verify directly in database
    lead = db_session.query(DemoRequest).filter(DemoRequest.id == data["id"]).first()
    assert lead is not None
    assert lead.full_name == "Dr. Sarah Jenkins"
    assert lead.work_email == "s.jenkins@metrohealth.org"
    assert lead.organization == "Metro Health Clinic"
    assert lead.claim_volume == "10,000 – 25,000 claims/mo"


def test_list_and_export_demo_requests(client: TestClient):
    """GET /api/demo/requests and export endpoints work cleanly."""
    # 1. Create a lead
    client.post(
        "/api/demo/request",
        json={
            "full_name": "Michael Chang",
            "work_email": "m.chang@valleycare.com",
            "organization": "Valley Care",
        },
    )

    # 2. Retrieve list
    list_resp = client.get("/api/demo/requests")
    assert list_resp.status_code == 200
    list_data = list_resp.json()
    assert list_data["total"] >= 1
    assert any(item["work_email"] == "m.chang@valleycare.com" for item in list_data["items"])

    # 3. Export CSV
    export_resp = client.get("/api/demo/requests/export")
    assert export_resp.status_code == 200
    assert "text/csv" in export_resp.headers["content-type"]
    assert "m.chang@valleycare.com" in export_resp.text
    assert "Michael Chang" in export_resp.text


def test_invalid_email_demo_request(client: TestClient):
    """POST /api/demo/request with invalid email returns 422 validation error."""
    response = client.post(
        "/api/demo/request",
        json={
            "full_name": "Test User",
            "work_email": "not-a-valid-email",
        },
    )
    assert response.status_code == 422
