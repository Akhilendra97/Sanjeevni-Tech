from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


class PharmacyDispensingItemCreate(BaseModel):
    medicine_id: int = Field(
        ...,
        gt=0,
    )

    inventory_batch_id: int | None = Field(
        default=None,
        gt=0,
    )

    prescribed_quantity: int = Field(
        ...,
        gt=0,
    )

    dispensed_quantity: int = Field(
        ...,
        gt=0,
    )

    unit_price: Decimal = Field(
        default=Decimal("0.00"),
        ge=0,
    )

    notes: str | None = None


class PharmacyDispensingCreate(BaseModel):
    dispensing_number: str = Field(
        ...,
        min_length=1,
        max_length=50,
    )

    prescription_id: int = Field(
        ...,
        gt=0,
    )

    patient_id: int = Field(
        ...,
        gt=0,
    )

    pharmacist_id: int | None = Field(
        default=None,
        gt=0,
    )

    notes: str | None = None

    items: list[PharmacyDispensingItemCreate] = Field(
        ...,
        min_length=1,
    )


class PharmacyDispensingUpdate(BaseModel):
    notes: str | None = None


class PharmacyDispensingStatusUpdate(BaseModel):
    status: str = Field(
        ...,
        min_length=1,
        max_length=50,
    )


class PharmacyDispensingItemResponse(BaseModel):
    id: int
    dispensing_id: int
    medicine_id: int
    inventory_batch_id: int
    prescribed_quantity: int
    dispensed_quantity: int
    unit_price: Decimal
    total_amount: Decimal
    notes: str | None

    model_config = ConfigDict(
        from_attributes=True,
    )


class PharmacyDispensingResponse(BaseModel):
    id: int
    dispensing_number: str
    prescription_id: int
    patient_id: int
    pharmacist_id: int | None
    status: str
    total_amount: Decimal
    notes: str | None
    dispensed_at: datetime | None
    created_at: datetime
    updated_at: datetime
    items: list[PharmacyDispensingItemResponse]

    model_config = ConfigDict(
        from_attributes=True,
    )
