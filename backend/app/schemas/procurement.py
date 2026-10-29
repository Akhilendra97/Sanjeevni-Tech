from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


# ============================================================
# SUPPLIER
# ============================================================

class SupplierCreate(BaseModel):
    supplier_code: str = Field(..., min_length=1, max_length=50)
    name: str = Field(..., min_length=1, max_length=150)
    contact_person: str | None = Field(default=None, max_length=150)
    phone: str | None = Field(default=None, max_length=30)
    email: str | None = Field(default=None, max_length=150)
    address: str | None = None
    city: str | None = Field(default=None, max_length=100)
    state: str | None = Field(default=None, max_length=100)
    postal_code: str | None = Field(default=None, max_length=20)
    gst_number: str | None = Field(default=None, max_length=30)
    payment_terms: str | None = Field(default=None, max_length=100)
    notes: str | None = None


class SupplierUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=150)
    contact_person: str | None = Field(default=None, max_length=150)
    phone: str | None = Field(default=None, max_length=30)
    email: str | None = Field(default=None, max_length=150)
    address: str | None = None
    city: str | None = Field(default=None, max_length=100)
    state: str | None = Field(default=None, max_length=100)
    postal_code: str | None = Field(default=None, max_length=20)
    gst_number: str | None = Field(default=None, max_length=30)
    payment_terms: str | None = Field(default=None, max_length=100)
    notes: str | None = None
    is_active: bool | None = None


class SupplierResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    supplier_code: str
    name: str
    contact_person: str | None
    phone: str | None
    email: str | None
    address: str | None
    city: str | None
    state: str | None
    postal_code: str | None
    gst_number: str | None
    payment_terms: str | None
    notes: str | None
    is_active: bool
    created_at: datetime
    updated_at: datetime


# ============================================================
# PURCHASE ORDER ITEMS
# ============================================================

class PurchaseOrderItemCreate(BaseModel):
    medicine_id: int = Field(..., gt=0)
    quantity: int = Field(..., gt=0)
    unit_price: Decimal = Field(..., ge=0)
    tax_percent: Decimal = Field(
        default=Decimal("0"),
        ge=0,
        le=100,
    )
    discount_amount: Decimal = Field(
        default=Decimal("0"),
        ge=0,
    )
    notes: str | None = None


class PurchaseOrderItemUpdate(BaseModel):
    quantity: int | None = Field(default=None, gt=0)
    unit_price: Decimal | None = Field(default=None, ge=0)
    tax_percent: Decimal | None = Field(
        default=None,
        ge=0,
        le=100,
    )
    discount_amount: Decimal | None = Field(
        default=None,
        ge=0,
    )
    notes: str | None = None


class PurchaseOrderItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    purchase_order_id: int
    medicine_id: int
    quantity: int
    unit_price: Decimal
    tax_percent: Decimal
    discount_amount: Decimal
    total_amount: Decimal
    notes: str | None


# ============================================================
# PURCHASE ORDER
# ============================================================

class PurchaseOrderCreate(BaseModel):
    purchase_order_number: str = Field(
        ...,
        min_length=1,
        max_length=50,
    )

    supplier_id: int = Field(..., gt=0)

    order_date: date = Field(
        default_factory=date.today,
    )

    expected_delivery_date: date | None = None

    status: str = Field(
        default="draft",
        max_length=50,
    )

    tax_amount: Decimal = Field(
        default=Decimal("0"),
        ge=0,
    )

    discount_amount: Decimal = Field(
        default=Decimal("0"),
        ge=0,
    )

    notes: str | None = None

    items: list[PurchaseOrderItemCreate] = Field(
        ...,
        min_length=1,
    )


class PurchaseOrderUpdate(BaseModel):
    expected_delivery_date: date | None = None

    status: str | None = Field(
        default=None,
        max_length=50,
    )

    tax_amount: Decimal | None = Field(
        default=None,
        ge=0,
    )

    discount_amount: Decimal | None = Field(
        default=None,
        ge=0,
    )

    notes: str | None = None


class PurchaseOrderResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    purchase_order_number: str
    supplier_id: int
    order_date: date
    expected_delivery_date: date | None
    status: str
    subtotal: Decimal
    tax_amount: Decimal
    discount_amount: Decimal
    total_amount: Decimal
    notes: str | None
    created_at: datetime
    updated_at: datetime
    items: list[PurchaseOrderItemResponse] = []


# ============================================================
# INVENTORY
# ============================================================

class InventoryCreate(BaseModel):
    medicine_id: int = Field(..., gt=0)
    quantity: int = Field(default=0, ge=0)
    reserved_quantity: int = Field(default=0, ge=0)
    minimum_stock: int = Field(default=10, ge=0)
    maximum_stock: int | None = Field(default=None, ge=0)
    unit_cost: Decimal = Field(
        default=Decimal("0"),
        ge=0,
    )
    location: str | None = Field(
        default=None,
        max_length=150,
    )
    batch_number: str | None = Field(
        default=None,
        max_length=100,
    )
    expiry_date: datetime | None = None
    status: str = Field(
        default="available",
        max_length=50,
    )
    notes: str | None = None


class InventoryUpdate(BaseModel):
    quantity: int | None = Field(default=None, ge=0)
    reserved_quantity: int | None = Field(default=None, ge=0)
    minimum_stock: int | None = Field(default=None, ge=0)
    maximum_stock: int | None = Field(default=None, ge=0)
    unit_cost: Decimal | None = Field(default=None, ge=0)
    location: str | None = Field(
        default=None,
        max_length=150,
    )
    batch_number: str | None = Field(
        default=None,
        max_length=100,
    )
    expiry_date: datetime | None = None
    status: str | None = Field(
        default=None,
        max_length=50,
    )
    notes: str | None = None


class InventoryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    medicine_id: int
    quantity: int
    reserved_quantity: int
    minimum_stock: int
    maximum_stock: int | None
    unit_cost: Decimal
    location: str | None
    batch_number: str | None
    expiry_date: datetime | None
    status: str
    notes: str | None
    created_at: datetime
    updated_at: datetime
