from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class QueueBase(BaseModel):
    queue_number: str = Field(..., min_length=1, max_length=100)
    token_number: int = Field(..., ge=1)

    patient_id: int
    appointment_id: int | None = None
    emergency_id: int | None = None
    doctor_id: int | None = None
    department_id: int

    queue_type: str = Field(
        default="opd",
        min_length=1,
        max_length=50,
    )

    priority: int = Field(
        default=0,
        ge=0,
    )

    status: str = Field(
        default="waiting",
        min_length=1,
        max_length=30,
    )

    check_in_time: datetime

    called_at: datetime | None = None
    service_start_time: datetime | None = None
    service_end_time: datetime | None = None

    notes: str | None = None


class QueueCreate(QueueBase):
    pass


class QueueUpdate(BaseModel):
    token_number: int | None = Field(
        default=None,
        ge=1,
    )

    appointment_id: int | None = None
    emergency_id: int | None = None
    doctor_id: int | None = None
    department_id: int | None = None

    queue_type: str | None = Field(
        default=None,
        min_length=1,
        max_length=50,
    )

    priority: int | None = Field(
        default=None,
        ge=0,
    )

    status: str | None = Field(
        default=None,
        min_length=1,
        max_length=30,
    )

    check_in_time: datetime | None = None
    called_at: datetime | None = None
    service_start_time: datetime | None = None
    service_end_time: datetime | None = None
    notes: str | None = None


class QueueResponse(QueueBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    updated_at: datetime
