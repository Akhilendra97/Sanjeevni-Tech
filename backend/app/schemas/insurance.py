from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


class InsuranceBase(BaseModel):
    policy_number: str = Field(min_length=1, max_length=100)
    patient_id: int
    insurance_provider: str = Field(min_length=1, max_length=150)
    policy_type: str = Field(min_length=1, max_length=100)
    policy_holder_name: str = Field(min_length=1, max_length=150)
    policy_holder_relation: str = Field(min_length=1, max_length=50)
    policy_start_date: date
    policy_end_date: date
    sum_insured: Decimal = Field(ge=0)
    coverage_percentage: Decimal = Field(ge=0, le=100)
    deductible_amount: Decimal = Field(default=0, ge=0)
    status: str = Field(default="active", max_length=30)
    is_primary: bool = False
    notes: str | None = None


class InsuranceCreate(InsuranceBase):
    pass


class InsuranceUpdate(BaseModel):
    policy_number: str | None = Field(
        default=None,
        min_length=1,
        max_length=100,
    )
    patient_id: int | None = None
    insurance_provider: str | None = Field(
        default=None,
        min_length=1,
        max_length=150,
    )
    policy_type: str | None = Field(
        default=None,
        min_length=1,
        max_length=100,
    )
    policy_holder_name: str | None = Field(
        default=None,
        min_length=1,
        max_length=150,
    )
    policy_holder_relation: str | None = Field(
        default=None,
        min_length=1,
        max_length=50,
    )
    policy_start_date: date | None = None
    policy_end_date: date | None = None
    sum_insured: Decimal | None = Field(default=None, ge=0)
    coverage_percentage: Decimal | None = Field(
        default=None,
        ge=0,
        le=100,
    )
    deductible_amount: Decimal | None = Field(default=None, ge=0)
    status: str | None = Field(default=None, max_length=30)
    is_primary: bool | None = None
    notes: str | None = None


class InsuranceResponse(InsuranceBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    updated_at: datetime
