from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class MedicineBase(BaseModel):
    medicine_code: str = Field(..., min_length=1, max_length=50)
    name: str = Field(..., min_length=1, max_length=150)
    generic_name: str | None = Field(default=None, max_length=150)
    category: str = Field(..., min_length=1, max_length=100)
    manufacturer: str | None = Field(default=None, max_length=150)
    dosage_form: str | None = Field(default=None, max_length=100)
    strength: str | None = Field(default=None, max_length=100)
    unit: str = Field(default="unit", max_length=50)
    purchase_price: float = Field(default=0, ge=0)
    selling_price: float = Field(default=0, ge=0)
    stock_quantity: int = Field(default=0, ge=0)
    reorder_level: int = Field(default=10, ge=0)
    expiry_date: datetime | None = None
    description: str | None = None
    is_active: bool = True


class MedicineCreate(MedicineBase):
    pass


class MedicineUpdate(BaseModel):
    medicine_code: str | None = Field(default=None, min_length=1, max_length=50)
    name: str | None = Field(default=None, min_length=1, max_length=150)
    generic_name: str | None = Field(default=None, max_length=150)
    category: str | None = Field(default=None, min_length=1, max_length=100)
    manufacturer: str | None = Field(default=None, max_length=150)
    dosage_form: str | None = Field(default=None, max_length=100)
    strength: str | None = Field(default=None, max_length=100)
    unit: str | None = Field(default=None, max_length=50)
    purchase_price: float | None = Field(default=None, ge=0)
    selling_price: float | None = Field(default=None, ge=0)
    stock_quantity: int | None = Field(default=None, ge=0)
    reorder_level: int | None = Field(default=None, ge=0)
    expiry_date: datetime | None = None
    description: str | None = None
    is_active: bool | None = None


class MedicineResponse(MedicineBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    updated_at: datetime