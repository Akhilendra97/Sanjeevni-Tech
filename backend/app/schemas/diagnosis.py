from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field


class DiagnosisBase(BaseModel):
    patient_id: int = Field(gt=0)
    doctor_id: int = Field(gt=0)
    diagnosis_code: str = Field(min_length=1, max_length=50)
    diagnosis_name: str = Field(min_length=1, max_length=255)
    diagnosis_type: str = Field(default="primary", max_length=50)
    description: str | None = None
    symptoms: str | None = None
    severity: str | None = Field(default=None, max_length=50)
    diagnosis_date: date
    notes: str | None = None


class DiagnosisCreate(DiagnosisBase):
    pass


class DiagnosisUpdate(BaseModel):
    diagnosis_name: str | None = Field(default=None, min_length=1, max_length=255)
    diagnosis_type: str | None = Field(default=None, max_length=50)
    description: str | None = None
    symptoms: str | None = None
    severity: str | None = Field(default=None, max_length=50)
    diagnosis_date: date | None = None
    notes: str | None = None


class DiagnosisResponse(DiagnosisBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    updated_at: datetime
