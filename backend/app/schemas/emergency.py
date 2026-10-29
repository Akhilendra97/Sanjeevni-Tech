from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class EmergencyBase(BaseModel):
    emergency_number: str = Field(
        ...,
        min_length=1,
        max_length=50,
    )

    patient_id: int = Field(
        ...,
        gt=0,
    )

    doctor_id: int | None = Field(
        default=None,
        gt=0,
    )

    registered_by: int | None = Field(
        default=None,
        gt=0,
    )

    arrival_time: datetime

    triage_level: str = Field(
        ...,
        min_length=1,
        max_length=30,
    )

    chief_complaint: str = Field(
        ...,
        min_length=1,
    )

    symptoms: str | None = None

    initial_assessment: str | None = None

    treatment: str | None = None

    status: str = Field(
        default="active",
        min_length=1,
        max_length=50,
    )

    disposition: str | None = Field(
        default=None,
        max_length=100,
    )

    discharge_time: datetime | None = None

    notes: str | None = None


class EmergencyCreate(EmergencyBase):
    pass


class EmergencyUpdate(BaseModel):
    doctor_id: int | None = Field(
        default=None,
        gt=0,
    )

    registered_by: int | None = Field(
        default=None,
        gt=0,
    )

    arrival_time: datetime | None = None

    triage_level: str | None = Field(
        default=None,
        min_length=1,
        max_length=30,
    )

    chief_complaint: str | None = Field(
        default=None,
        min_length=1,
    )

    symptoms: str | None = None

    initial_assessment: str | None = None

    treatment: str | None = None

    status: str | None = Field(
        default=None,
        min_length=1,
        max_length=50,
    )

    disposition: str | None = Field(
        default=None,
        max_length=100,
    )

    discharge_time: datetime | None = None

    notes: str | None = None


class EmergencyResponse(EmergencyBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(
        from_attributes=True,
    )
