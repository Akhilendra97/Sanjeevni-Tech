from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class RadiologyBase(BaseModel):
    radiology_number: str = Field(
        ...,
        min_length=1,
        max_length=50,
    )
    patient_id: int
    doctor_id: int
    examination_type: str = Field(
        ...,
        min_length=1,
        max_length=100,
    )
    body_part: str = Field(
        ...,
        min_length=1,
        max_length=100,
    )
    clinical_indication: str | None = None
    priority: str = Field(
        default="routine",
        max_length=30,
    )
    status: str = Field(
        default="ordered",
        max_length=30,
    )
    requested_at: datetime
    scheduled_at: datetime | None = None
    performed_at: datetime | None = None
    contrast_used: bool = False
    contrast_details: str | None = None
    notes: str | None = None


class RadiologyCreate(RadiologyBase):
    pass


class RadiologyUpdate(BaseModel):
    radiology_number: str | None = Field(
        default=None,
        min_length=1,
        max_length=50,
    )
    patient_id: int | None = None
    doctor_id: int | None = None
    examination_type: str | None = Field(
        default=None,
        min_length=1,
        max_length=100,
    )
    body_part: str | None = Field(
        default=None,
        min_length=1,
        max_length=100,
    )
    clinical_indication: str | None = None
    priority: str | None = Field(
        default=None,
        max_length=30,
    )
    status: str | None = Field(
        default=None,
        max_length=30,
    )
    requested_at: datetime | None = None
    scheduled_at: datetime | None = None
    performed_at: datetime | None = None
    contrast_used: bool | None = None
    contrast_details: str | None = None
    notes: str | None = None


class RadiologyResponse(RadiologyBase):
    doctor_name: str | None = None
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
