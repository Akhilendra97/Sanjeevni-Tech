from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class BloodRequestBase(BaseModel):
    blood_bank_id: int = Field(..., gt=0)
    patient_id: int = Field(..., gt=0)
    blood_group: str = Field(..., min_length=2, max_length=10)
    component_type: str = Field(..., min_length=2, max_length=50)
    units_required: int = Field(..., gt=0)
    priority: str = Field(default="normal", max_length=30)
    status: str = Field(default="pending", max_length=30)
    reason: str | None = None
    notes: str | None = None


class BloodRequestCreate(BloodRequestBase):
    request_number: str = Field(
        ...,
        min_length=2,
        max_length=50,
    )


class BloodRequestUpdate(BaseModel):
    blood_bank_id: int | None = Field(default=None, gt=0)
    patient_id: int | None = Field(default=None, gt=0)
    blood_group: str | None = Field(default=None, min_length=2, max_length=10)
    component_type: str | None = Field(default=None, min_length=2, max_length=50)
    units_required: int | None = Field(default=None, gt=0)
    priority: str | None = Field(default=None, max_length=30)
    status: str | None = Field(default=None, max_length=30)
    reason: str | None = None
    notes: str | None = None


class BloodRequestResponse(BloodRequestBase):
    id: int
    request_number: str
    requested_at: datetime
    fulfilled_at: datetime | None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)