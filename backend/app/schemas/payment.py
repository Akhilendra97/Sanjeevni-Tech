from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


class PaymentBase(BaseModel):
    payment_number: str = Field(..., min_length=1, max_length=100)
    invoice_id: int
    patient_id: int
    payment_date: date
    amount: Decimal = Field(..., gt=0)
    payment_method: str = Field(..., min_length=1, max_length=50)
    transaction_reference: str | None = Field(
        default=None,
        max_length=150,
    )
    status: str = Field(default="completed", min_length=1, max_length=30)
    received_by: int | None = None
    remarks: str | None = None


class PaymentCreate(PaymentBase):
    pass


class PaymentUpdate(BaseModel):
    payment_number: str | None = Field(
        default=None,
        min_length=1,
        max_length=100,
    )
    invoice_id: int | None = None
    patient_id: int | None = None
    payment_date: date | None = None
    amount: Decimal | None = Field(default=None, gt=0)
    payment_method: str | None = Field(
        default=None,
        min_length=1,
        max_length=50,
    )
    transaction_reference: str | None = Field(
        default=None,
        max_length=150,
    )
    status: str | None = Field(
        default=None,
        min_length=1,
        max_length=30,
    )
    received_by: int | None = None
    remarks: str | None = None


class PaymentResponse(PaymentBase):
    patient_name: str | None = None
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    updated_at: datetime
