from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field


class BloodBankBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=150)
    code: str = Field(..., min_length=2, max_length=50)
    location: str | None = Field(default=None, max_length=255)
    contact_number: str | None = Field(default=None, max_length=20)
    email: str | None = Field(default=None, max_length=255)
    license_number: str | None = Field(default=None, max_length=100)
    is_active: bool = True
    notes: str | None = None


class BloodBankCreate(BloodBankBase):
    pass


class BloodBankUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=150)
    code: str | None = Field(default=None, min_length=2, max_length=50)
    location: str | None = Field(default=None, max_length=255)
    contact_number: str | None = Field(default=None, max_length=20)
    email: str | None = Field(default=None, max_length=255)
    license_number: str | None = Field(default=None, max_length=100)
    is_active: bool | None = None
    notes: str | None = None


class BloodBankResponse(BloodBankBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)