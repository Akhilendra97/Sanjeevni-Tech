from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field


class PrescriptionBase(BaseModel):
    prescription_number: str = Field(
        ...,
        min_length=1,
        max_length=50,
    )

    patient_id: int = Field(
        ...,
        gt=0,
    )

    doctor_id: int = Field(
        ...,
        gt=0,
    )

    prescription_date: date

    diagnosis: str | None = None

    medicines: str = Field(
        ...,
        min_length=1,
    )

    instructions: str | None = None

    duration: str | None = Field(
        default=None,
        max_length=100,
    )

    follow_up_date: date | None = None

    notes: str | None = None


class PrescriptionCreate(PrescriptionBase):
    pass


class PrescriptionUpdate(BaseModel):
    prescription_date: date | None = None

    diagnosis: str | None = None

    medicines: str | None = Field(
        default=None,
        min_length=1,
    )

    instructions: str | None = None

    duration: str | None = Field(
        default=None,
        max_length=100,
    )

    follow_up_date: date | None = None

    notes: str | None = None


class PrescriptionResponse(PrescriptionBase):
    doctor_name: str | None = None
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(
        from_attributes=True,
    )