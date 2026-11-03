"""Pydantic schemas for prospective customer demo requests (leads)."""

import re
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field, field_validator

EMAIL_REGEX = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


class DemoRequestCreate(BaseModel):
    """Payload submitted when a user requests a product demo."""

    full_name: str = Field(..., min_length=1, max_length=100, description="Customer full name")
    work_email: str = Field(..., max_length=150, description="Customer business email")
    organization: Optional[str] = Field(default=None, max_length=150, description="Clinic or health system name")
    phone: Optional[str] = Field(default=None, max_length=50, description="Direct phone or extension")
    claim_volume: Optional[str] = Field(default=None, max_length=50, description="Estimated monthly claim volume")
    notes: Optional[str] = Field(default=None, max_length=1000, description="Operational challenges or questions")

    @field_validator("work_email")
    @classmethod
    def validate_email(cls, v: str) -> str:
        cleaned = v.strip().lower()
        if not EMAIL_REGEX.match(cleaned):
            raise ValueError("Invalid email address format")
        return cleaned


class DemoRequestItem(BaseModel):
    """Individual demo lead record."""

    id: int
    full_name: str
    work_email: str
    organization: Optional[str]
    phone: Optional[str]
    claim_volume: Optional[str]
    notes: Optional[str]
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class DemoRequestResponse(BaseModel):
    """Submission confirmation response."""

    success: bool
    message: str
    id: int


class DemoRequestListResponse(BaseModel):
    """List of all submitted customer leads."""

    items: List[DemoRequestItem]
    total: int
