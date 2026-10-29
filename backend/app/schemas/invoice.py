from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


class InvoiceBase(BaseModel):
    invoice_number: str = Field(..., min_length=1, max_length=100)
    patient_id: int
    admission_id: int | None = None
    invoice_date: date
    due_date: date | None = None
    subtotal: Decimal = Field(..., ge=0)
    tax_amount: Decimal = Field(default=Decimal("0.00"), ge=0)
    discount_amount: Decimal = Field(default=Decimal("0.00"), ge=0)
    total_amount: Decimal = Field(..., ge=0)
    paid_amount: Decimal = Field(default=Decimal("0.00"), ge=0)
    balance_amount: Decimal = Field(..., ge=0)
    status: str = Field(default="unpaid", min_length=1, max_length=30)
    notes: str | None = None


class InvoiceCreate(InvoiceBase):
    pass


class InvoiceUpdate(BaseModel):
    invoice_number: str | None = Field(default=None, min_length=1, max_length=100)
    patient_id: int | None = None
    admission_id: int | None = None
    invoice_date: date | None = None
    due_date: date | None = None
    subtotal: Decimal | None = Field(default=None, ge=0)
    tax_amount: Decimal | None = Field(default=None, ge=0)
    discount_amount: Decimal | None = Field(default=None, ge=0)
    total_amount: Decimal | None = Field(default=None, ge=0)
    paid_amount: Decimal | None = Field(default=None, ge=0)
    balance_amount: Decimal | None = Field(default=None, ge=0)
    status: str | None = Field(default=None, min_length=1, max_length=30)
    notes: str | None = None


class InvoiceResponse(InvoiceBase):
    patient_name: str | None = None
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    updated_at: datetime
