from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


class InventoryBase(BaseModel):
    medicine_id: int = Field(..., gt=0)
    quantity: int = Field(default=0, ge=0)
    reserved_quantity: int = Field(default=0, ge=0)
    minimum_stock: int = Field(default=10, ge=0)
    maximum_stock: int | None = Field(default=None, ge=0)
    unit_cost: Decimal = Field(default=Decimal("0"), ge=0)
    location: str | None = Field(default=None, max_length=150)
    batch_number: str | None = Field(default=None, max_length=100)
    expiry_date: datetime | None = None
    status: str = Field(default="available", max_length=50)
    notes: str | None = None


class InventoryCreate(InventoryBase):
    pass


class InventoryUpdate(BaseModel):
    quantity: int | None = Field(default=None, ge=0)
    reserved_quantity: int | None = Field(default=None, ge=0)
    minimum_stock: int | None = Field(default=None, ge=0)
    maximum_stock: int | None = Field(default=None, ge=0)
    unit_cost: Decimal | None = Field(default=None, ge=0)
    location: str | None = Field(default=None, max_length=150)
    batch_number: str | None = Field(default=None, max_length=100)
    expiry_date: datetime | None = None
    status: str | None = Field(default=None, max_length=50)
    notes: str | None = None


class InventoryQuantityAdjustment(BaseModel):
    quantity_change: int = Field(..., description="Positive to add stock, negative to remove stock.")


class InventoryReservation(BaseModel):
    quantity: int = Field(..., gt=0)


class InventoryResponse(InventoryBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    updated_at: datetime
