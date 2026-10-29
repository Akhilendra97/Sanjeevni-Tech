from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class SurgeryBase(BaseModel):
    surgery_number: str = Field(
        ...,
        min_length=1,
        max_length=100,
    )

    patient_id: int
    operation_theatre_id: int
    department_id: int
    surgeon_id: int
    anaesthetist_id: int | None = None

    procedure_name: str = Field(
        ...,
        min_length=1,
        max_length=200,
    )

    surgery_type: str = Field(
        default="elective",
        min_length=1,
        max_length=50,
    )

    scheduled_start: datetime
    scheduled_end: datetime

    actual_start: datetime | None = None
    actual_end: datetime | None = None

    preoperative_diagnosis: str | None = None
    postoperative_diagnosis: str | None = None
    procedure_details: str | None = None

    anaesthesia_type: str | None = Field(
        default=None,
        max_length=100,
    )

    findings: str | None = None
    complications: str | None = None
    postoperative_instructions: str | None = None

    status: str = Field(
        default="scheduled",
        min_length=1,
        max_length=30,
    )

    cancellation_reason: str | None = None
    notes: str | None = None


class SurgeryCreate(SurgeryBase):
    pass


class SurgeryUpdate(BaseModel):
    patient_id: int | None = None
    operation_theatre_id: int | None = None
    department_id: int | None = None
    surgeon_id: int | None = None
    anaesthetist_id: int | None = None

    procedure_name: str | None = Field(
        default=None,
        min_length=1,
        max_length=200,
    )

    surgery_type: str | None = Field(
        default=None,
        min_length=1,
        max_length=50,
    )

    scheduled_start: datetime | None = None
    scheduled_end: datetime | None = None

    actual_start: datetime | None = None
    actual_end: datetime | None = None

    preoperative_diagnosis: str | None = None
    postoperative_diagnosis: str | None = None
    procedure_details: str | None = None

    anaesthesia_type: str | None = Field(
        default=None,
        max_length=100,
    )

    findings: str | None = None
    complications: str | None = None
    postoperative_instructions: str | None = None

    status: str | None = Field(
        default=None,
        min_length=1,
        max_length=30,
    )

    cancellation_reason: str | None = None
    notes: str | None = None


class SurgeryResponse(SurgeryBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    updated_at: datetime
