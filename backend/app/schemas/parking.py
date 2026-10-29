from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


class ParkingBase(BaseModel):
    parking_number: str = Field(..., min_length=1, max_length=100)
    slot_number: str = Field(..., min_length=1, max_length=50)
    vehicle_number: str = Field(..., min_length=1, max_length=30)
    vehicle_type: str = Field(default="car", min_length=1, max_length=50)
    patient_id: int | None = None
    visitor_name: str | None = Field(default=None, max_length=150)
    visitor_contact: str | None = Field(default=None, max_length=30)
    staff_id: int | None = None
    entry_time: datetime
    exit_time: datetime | None = None
    parking_fee: Decimal = Field(default=Decimal("0.00"), ge=0)
    payment_status: str = Field(default="pending", min_length=1, max_length=30)
    status: str = Field(default="parked", min_length=1, max_length=30)
    notes: str | None = None


class ParkingCreate(ParkingBase):
    pass


class ParkingUpdate(BaseModel):
    parking_number: str | None = Field(
        default=None,
        min_length=1,
        max_length=100,
    )
    slot_number: str | None = Field(
        default=None,
        min_length=1,
        max_length=50,
    )
    vehicle_number: str | None = Field(
        default=None,
        min_length=1,
        max_length=30,
    )
    vehicle_type: str | None = Field(
        default=None,
        min_length=1,
        max_length=50,
    )
    patient_id: int | None = None
    visitor_name: str | None = Field(
        default=None,
        max_length=150,
    )
    visitor_contact: str | None = Field(
        default=None,
        max_length=30,
    )
    staff_id: int | None = None
    entry_time: datetime | None = None
    exit_time: datetime | None = None
    parking_fee: Decimal | None = Field(
        default=None,
        ge=0,
    )
    payment_status: str | None = Field(
        default=None,
        min_length=1,
        max_length=30,
    )
    status: str | None = Field(
        default=None,
        min_length=1,
        max_length=30,
    )
    notes: str | None = None


class ParkingResponse(ParkingBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
