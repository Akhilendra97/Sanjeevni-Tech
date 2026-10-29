from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field


class DischargeBase(BaseModel):
    admission_id: int
    patient_id: int
    doctor_id: int
    discharge_number: str = Field(..., min_length=1, max_length=50)
    discharge_date: date
    discharge_type: str = Field(default="normal", max_length=50)
    final_diagnosis: str | None = None
    treatment_summary: str | None = None
    medications: str | None = None
    follow_up_instructions: str | None = None
    condition_at_discharge: str | None = Field(
        default=None,
        max_length=100,
    )
    notes: str | None = None


class DischargeCreate(DischargeBase):
    pass


class DischargeUpdate(BaseModel):
    discharge_date: date | None = None
    discharge_type: str | None = Field(default=None, max_length=50)
    final_diagnosis: str | None = None
    treatment_summary: str | None = None
    medications: str | None = None
    follow_up_instructions: str | None = None
    condition_at_discharge: str | None = Field(
        default=None,
        max_length=100,
    )
    notes: str | None = None


class DischargeResponse(DischargeBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    updated_at: datetime