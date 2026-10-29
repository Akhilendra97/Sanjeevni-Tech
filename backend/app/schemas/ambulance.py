from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class AmbulanceBase(BaseModel):
    ambulance_number: str = Field(
        ...,
        min_length=1,
        max_length=50,
    )

    registration_number: str = Field(
        ...,
        min_length=1,
        max_length=50,
    )

    ambulance_type: str = Field(
        ...,
        min_length=2,
        max_length=50,
    )

    department_id: int | None = Field(
        default=None,
        gt=0,
    )

    driver_name: str | None = Field(
        default=None,
        max_length=150,
    )

    driver_phone: str | None = Field(
        default=None,
        max_length=20,
    )

    equipment_details: str | None = None

    status: str = Field(
        default="available",
        min_length=2,
        max_length=30,
    )

    location: str | None = Field(
        default=None,
        max_length=255,
    )

    is_active: bool = True

    notes: str | None = None


class AmbulanceCreate(AmbulanceBase):
    pass


class AmbulanceUpdate(BaseModel):
    ambulance_number: str | None = Field(
        default=None,
        min_length=1,
        max_length=50,
    )

    registration_number: str | None = Field(
        default=None,
        min_length=1,
        max_length=50,
    )

    ambulance_type: str | None = Field(
        default=None,
        min_length=2,
        max_length=50,
    )

    department_id: int | None = Field(
        default=None,
        gt=0,
    )

    driver_name: str | None = Field(
        default=None,
        max_length=150,
    )

    driver_phone: str | None = Field(
        default=None,
        max_length=20,
    )

    equipment_details: str | None = None

    status: str | None = Field(
        default=None,
        min_length=2,
        max_length=30,
    )

    location: str | None = Field(
        default=None,
        max_length=255,
    )

    is_active: bool | None = None

    notes: str | None = None


class AmbulanceResponse(AmbulanceBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(
        from_attributes=True,
    )