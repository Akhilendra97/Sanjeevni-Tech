from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class PharmacyBase(BaseModel):
    pharmacy_number: str = Field(..., min_length=1, max_length=100)
    pharmacy_name: str = Field(..., min_length=1, max_length=150)
    department_id: int | None = None
    managed_by: int | None = None
    pharmacy_type: str = Field(default="main", min_length=1, max_length=50)
    location: str | None = Field(default=None, max_length=200)
    contact_number: str | None = Field(default=None, max_length=30)
    operating_hours: str | None = Field(default=None, max_length=200)
    status: str = Field(default="active", min_length=1, max_length=30)
    notes: str | None = None


class PharmacyCreate(PharmacyBase):
    pass


class PharmacyUpdate(BaseModel):
    pharmacy_number: str | None = Field(
        default=None,
        min_length=1,
        max_length=100,
    )
    pharmacy_name: str | None = Field(
        default=None,
        min_length=1,
        max_length=150,
    )
    department_id: int | None = None
    managed_by: int | None = None
    pharmacy_type: str | None = Field(
        default=None,
        min_length=1,
        max_length=50,
    )
    location: str | None = Field(
        default=None,
        max_length=200,
    )
    contact_number: str | None = Field(
        default=None,
        max_length=30,
    )
    operating_hours: str | None = Field(
        default=None,
        max_length=200,
    )
    status: str | None = Field(
        default=None,
        min_length=1,
        max_length=30,
    )
    notes: str | None = None


class PharmacyResponse(PharmacyBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
