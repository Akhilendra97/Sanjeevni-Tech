from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field


class EquipmentBase(BaseModel):
    equipment_code: str = Field(
        min_length=1,
        max_length=50,
    )

    name: str = Field(
        min_length=1,
        max_length=150,
    )

    category: str = Field(
        min_length=1,
        max_length=100,
    )

    manufacturer: str | None = Field(
        default=None,
        max_length=150,
    )

    model_number: str | None = Field(
        default=None,
        max_length=100,
    )

    serial_number: str | None = Field(
        default=None,
        max_length=150,
    )

    purchase_date: date | None = None

    purchase_cost: float | None = Field(
        default=None,
        ge=0,
    )

    warranty_expiry: date | None = None

    location: str | None = Field(
        default=None,
        max_length=255,
    )

    department_id: int | None = Field(
        default=None,
        gt=0,
    )

    status: str = Field(
        default="active",
        min_length=1,
        max_length=50,
    )

    description: str | None = None

    is_active: bool = True


class EquipmentCreate(EquipmentBase):
    pass


class EquipmentUpdate(BaseModel):
    equipment_code: str | None = Field(
        default=None,
        min_length=1,
        max_length=50,
    )

    name: str | None = Field(
        default=None,
        min_length=1,
        max_length=150,
    )

    category: str | None = Field(
        default=None,
        min_length=1,
        max_length=100,
    )

    manufacturer: str | None = Field(
        default=None,
        max_length=150,
    )

    model_number: str | None = Field(
        default=None,
        max_length=100,
    )

    serial_number: str | None = Field(
        default=None,
        max_length=150,
    )

    purchase_date: date | None = None

    purchase_cost: float | None = Field(
        default=None,
        ge=0,
    )

    warranty_expiry: date | None = None

    location: str | None = Field(
        default=None,
        max_length=255,
    )

    department_id: int | None = Field(
        default=None,
        gt=0,
    )

    status: str | None = Field(
        default=None,
        min_length=1,
        max_length=50,
    )

    description: str | None = None

    is_active: bool | None = None


class EquipmentResponse(EquipmentBase):
    model_config = ConfigDict(
        from_attributes=True,
    )

    id: int
    created_at: datetime
    updated_at: datetime
