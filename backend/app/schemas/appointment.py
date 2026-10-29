from datetime import date, time

from pydantic import BaseModel, ConfigDict, Field

from app.core.constants import AppointmentStatus, Priority


class AppointmentCreate(BaseModel):
    appointment_number: str = Field(
        ...,
        min_length=1,
        max_length=50,
    )

    patient_id: int = Field(..., gt=0)

    doctor_id: int = Field(..., gt=0)

    appointment_date: date

    appointment_time: time

    status: AppointmentStatus = AppointmentStatus.SCHEDULED

    priority: Priority = Priority.NORMAL

    reason: str | None = Field(
        default=None,
        max_length=2000,
    )

    notes: str | None = Field(
        default=None,
        max_length=5000,
    )


class AppointmentUpdate(BaseModel):
    appointment_date: date | None = None

    appointment_time: time | None = None

    status: AppointmentStatus | None = None

    priority: Priority | None = None

    reason: str | None = Field(
        default=None,
        max_length=2000,
    )

    notes: str | None = Field(
        default=None,
        max_length=5000,
    )

    cancellation_reason: str | None = Field(
        default=None,
        max_length=2000,
    )


class AppointmentResponse(BaseModel):
    id: int
    appointment_number: str
    patient_id: int
    doctor_id: int
    doctor_name: str | None = None
    appointment_date: date
    appointment_time: time
    status: str
    priority: str
    reason: str | None
    notes: str | None
    cancellation_reason: str | None

    model_config = ConfigDict(
        from_attributes=True,
    )