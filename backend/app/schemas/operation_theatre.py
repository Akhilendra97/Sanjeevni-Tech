from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class OperationTheatreBase(BaseModel):
    ot_number: str = Field(..., min_length=1, max_length=100)
    ot_name: str = Field(..., min_length=1, max_length=150)
    ot_type: str = Field(..., min_length=1, max_length=100)

    department_id: int
    patient_id: int
    surgeon_id: int
    anaesthetist_id: int | None = None
    assigned_staff_id: int | None = None

    surgery_type: str = Field(
        default="elective",
        min_length=1,
        max_length=30,
    )

    scheduled_start: datetime
    scheduled_end: datetime

    actual_start: datetime | None = None
    actual_end: datetime | None = None

    status: str = Field(
        default="scheduled",
        min_length=1,
        max_length=30,
    )

    preoperative_notes: str | None = None
    postoperative_notes: str | None = None
    equipment_notes: str | None = None
    cancellation_reason: str | None = None
    notes: str | None = None


class OperationTheatreCreate(OperationTheatreBase):
    pass


class OperationTheatreUpdate(BaseModel):
    ot_name: str | None = Field(
        default=None,
        min_length=1,
        max_length=150,
    )

    ot_type: str | None = Field(
        default=None,
        min_length=1,
        max_length=100,
    )

    department_id: int | None = None
    patient_id: int | None = None
    surgeon_id: int | None = None
    anaesthetist_id: int | None = None
    assigned_staff_id: int | None = None

    surgery_type: str | None = Field(
        default=None,
        min_length=1,
        max_length=30,
    )

    scheduled_start: datetime | None = None
    scheduled_end: datetime | None = None

    actual_start: datetime | None = None
    actual_end: datetime | None = None

    status: str | None = Field(
        default=None,
        min_length=1,
        max_length=30,
    )

    preoperative_notes: str | None = None
    postoperative_notes: str | None = None
    equipment_notes: str | None = None
    cancellation_reason: str | None = None
    notes: str | None = None


class OperationTheatreResponse(OperationTheatreBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    updated_at: datetime
