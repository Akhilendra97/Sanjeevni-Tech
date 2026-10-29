from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


class InventoryBatchCreate(BaseModel):
    medicine_id: int = Field(
        ...,
        gt=0,
    )

    batch_number: str = Field(
        ...,
        min_length=1,
        max_length=100,
    )

    quantity: int = Field(
        default=0,
        ge=0,
    )

    reserved_quantity: int = Field(
        default=0,
        ge=0,
    )

    unit_cost: Decimal = Field(
        default=Decimal("0"),
        ge=0,
    )

    expiry_date: datetime | None = None

    location: str | None = Field(
        default=None,
        max_length=150,
    )

    status: str = Field(
        default="available",
        max_length=50,
    )

    notes: str | None = None


class InventoryBatchUpdate(BaseModel):
    quantity: int | None = Field(
        default=None,
        ge=0,
    )

    reserved_quantity: int | None = Field(
        default=None,
        ge=0,
    )

    unit_cost: Decimal | None = Field(
        default=None,
        ge=0,
    )

    expiry_date: datetime | None = None

    location: str | None = Field(
        default=None,
        max_length=150,
    )

    status: str | None = Field(
        default=None,
        max_length=50,
    )

    notes: str | None = None


class InventoryBatchQuantityAdjustment(BaseModel):
    quantity_change: int = Field(
        ...,
        description=(
            "Positive value adds stock; "
            "negative value removes stock."
        ),
    )


class InventoryBatchReservation(BaseModel):
    quantity: int = Field(
        ...,
        gt=0,
    )


class InventoryBatchResponse(BaseModel):
    model_config = ConfigDict(
        from_attributes=True,
    )

    id: int
    medicine_id: int
    batch_number: str
    quantity: int
    reserved_quantity: int
    unit_cost: Decimal
    expiry_date: datetime | None
    location: str | None
    status: str
    notes: str | None
    created_at: datetime
    updated_at: datetime
