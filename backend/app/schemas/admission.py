from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field


class AdmissionBase(BaseModel):
    admission_number: str = Field(
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

    ward_id: int | None = Field(
        default=None,
        gt=0,
    )

    bed_id: int | None = Field(
        default=None,
        gt=0,
    )

    admission_date: date

    status: str = "admitted"

    reason: str | None = None

    diagnosis: str | None = None

    notes: str | None = None

    discharge_summary: str | None = None


class AdmissionCreate(AdmissionBase):
    pass


class AdmissionUpdate(BaseModel):
    ward_id: int | None = Field(
        default=None,
        gt=0,
    )

    bed_id: int | None = Field(
        default=None,
        gt=0,
    )

    discharge_date: date | None = None

    status: str | None = None

    reason: str | None = None

    diagnosis: str | None = None

    notes: str | None = None

    discharge_summary: str | None = None


class AdmissionResponse(AdmissionBase):
    id: int

    discharge_date: date | None

    created_at: datetime

    updated_at: datetime

    model_config = ConfigDict(
        from_attributes=True,
    )