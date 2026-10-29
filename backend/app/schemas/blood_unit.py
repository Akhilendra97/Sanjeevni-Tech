from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field


class BloodUnitBase(BaseModel):
    blood_bank_id: int = Field(..., gt=0)
    unit_number: str = Field(..., min_length=2, max_length=50)
    blood_group: str = Field(..., min_length=2, max_length=10)
    component_type: str = Field(..., min_length=2, max_length=50)
    collection_date: date
    expiry_date: date
    volume_ml: float | None = Field(default=None, gt=0)
    status: str = Field(default="available", max_length=30)
    donor_id: str | None = Field(default=None, max_length=100)
    storage_location: str | None = Field(default=None, max_length=100)
    notes: str | None = None


class BloodUnitCreate(BloodUnitBase):
    pass


class BloodUnitUpdate(BaseModel):
    blood_bank_id: int | None = Field(default=None, gt=0)
    blood_group: str | None = Field(default=None, min_length=2, max_length=10)
    component_type: str | None = Field(default=None, min_length=2, max_length=50)
    collection_date: date | None = None
    expiry_date: date | None = None
    volume_ml: float | None = Field(default=None, gt=0)
    status: str | None = Field(default=None, max_length=30)
    donor_id: str | None = Field(default=None, max_length=100)
    storage_location: str | None = Field(default=None, max_length=100)
    notes: str | None = None


class BloodUnitResponse(BloodUnitBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)