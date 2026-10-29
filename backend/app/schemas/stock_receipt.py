from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


class StockReceiptItemCreate(BaseModel):
    purchase_order_item_id: int = Field(..., gt=0)
    received_quantity: int = Field(..., gt=0)
    unit_cost: Decimal = Field(..., ge=0)
    batch_number: str | None = Field(
        default=None,
        max_length=100,
    )
    expiry_date: datetime | None = None
    location: str | None = Field(
        default=None,
        max_length=150,
    )
    notes: str | None = None


class StockReceiptCreate(BaseModel):
    receipt_number: str = Field(
        ...,
        min_length=1,
        max_length=50,
    )

    purchase_order_id: int = Field(
        ...,
        gt=0,
    )

    received_date: date = Field(
        default_factory=date.today,
    )

    received_by: int | None = Field(
        default=None,
        gt=0,
    )

    notes: str | None = None

    items: list[StockReceiptItemCreate] = Field(
        ...,
        min_length=1,
    )


class StockReceiptItemResponse(BaseModel):
    model_config = ConfigDict(
        from_attributes=True,
    )

    id: int
    receipt_id: int
    purchase_order_item_id: int
    medicine_id: int
    received_quantity: int
    unit_cost: Decimal
    batch_number: str | None
    expiry_date: datetime | None
    location: str | None
    notes: str | None


class StockReceiptResponse(BaseModel):
    model_config = ConfigDict(
        from_attributes=True,
    )

    id: int
    receipt_number: str
    purchase_order_id: int
    received_date: date
    received_by: int | None
    notes: str | None
    created_at: datetime
    updated_at: datetime
    items: list[StockReceiptItemResponse] = Field(
        default_factory=list,
    )
