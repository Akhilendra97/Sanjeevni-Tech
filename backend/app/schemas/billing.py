from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field


class BillingBase(BaseModel):
    patient_id: int = Field(..., gt=0)
    bill_date: date
    bill_type: str = Field(..., min_length=2, max_length=50)
    description: str | None = None

    subtotal: float = Field(default=0, ge=0)
    discount: float = Field(default=0, ge=0)
    tax: float = Field(default=0, ge=0)
    total_amount: float = Field(default=0, ge=0)
    paid_amount: float = Field(default=0, ge=0)

    payment_status: str = Field(
        default="pending",
        min_length=2,
        max_length=30,
    )

    payment_method: str | None = Field(
        default=None,
        max_length=50,
    )

    notes: str | None = None


class BillingCreate(BillingBase):
    bill_number: str = Field(
        ...,
        min_length=2,
        max_length=50,
    )


class BillingUpdate(BaseModel):
    patient_id: int | None = Field(default=None, gt=0)
    bill_date: date | None = None

    bill_type: str | None = Field(
        default=None,
        min_length=2,
        max_length=50,
    )

    description: str | None = None

    subtotal: float | None = Field(default=None, ge=0)
    discount: float | None = Field(default=None, ge=0)
    tax: float | None = Field(default=None, ge=0)
    total_amount: float | None = Field(default=None, ge=0)
    paid_amount: float | None = Field(default=None, ge=0)

    payment_status: str | None = Field(
        default=None,
        min_length=2,
        max_length=30,
    )

    payment_method: str | None = Field(
        default=None,
        max_length=50,
    )

    notes: str | None = None


class BillingResponse(BillingBase):
    patient_name: str | None = None
    id: int
    bill_number: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)