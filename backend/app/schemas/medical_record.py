from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class MedicalRecordBase(BaseModel):
    patient_id: int = Field(..., gt=0)
    doctor_id: int = Field(..., gt=0)

    record_number: str = Field(
        ...,
        min_length=1,
        max_length=50,
    )

    chief_complaint: str | None = None
    symptoms: str | None = None
    diagnosis: str | None = None
    treatment_plan: str | None = None
    clinical_notes: str | None = None
    medical_history: str | None = None
    allergies: str | None = None

    record_type: str = Field(
        default="consultation",
        min_length=1,
        max_length=50,
    )


class MedicalRecordCreate(MedicalRecordBase):
    pass


class MedicalRecordUpdate(BaseModel):
    chief_complaint: str | None = None
    symptoms: str | None = None
    diagnosis: str | None = None
    treatment_plan: str | None = None
    clinical_notes: str | None = None
    medical_history: str | None = None
    allergies: str | None = None
    record_type: str | None = Field(
        default=None,
        min_length=1,
        max_length=50,
    )


class MedicalRecordResponse(MedicalRecordBase):
    doctor_name: str | None = None
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(
        from_attributes=True,
    )