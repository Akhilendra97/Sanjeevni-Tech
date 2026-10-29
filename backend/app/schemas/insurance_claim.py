from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


class InsuranceClaimBase(BaseModel):
    claim_number: str = Field(min_length=1, max_length=100)
    insurance_id: int
    patient_id: int
    claim_date: date
    admission_id: int | None = None
    claim_amount: Decimal = Field(ge=0)
    approved_amount: Decimal = Field(default=0, ge=0)
    rejected_amount: Decimal = Field(default=0, ge=0)
    status: str = Field(default="submitted", max_length=30)
    settlement_date: date | None = None
    rejection_reason: str | None = None
    remarks: str | None = None


class InsuranceClaimCreate(InsuranceClaimBase):
    pass


class InsuranceClaimUpdate(BaseModel):
    claim_number: str | None = Field(
        default=None,
        min_length=1,
        max_length=100,
    )
    insurance_id: int | None = None
    patient_id: int | None = None
    claim_date: date | None = None
    admission_id: int | None = None
    claim_amount: Decimal | None = Field(default=None, ge=0)
    approved_amount: Decimal | None = Field(default=None, ge=0)
    rejected_amount: Decimal | None = Field(default=None, ge=0)
    status: str | None = Field(default=None, max_length=30)
    settlement_date: date | None = None
    rejection_reason: str | None = None
    remarks: str | None = None


class InsuranceClaimResponse(InsuranceClaimBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    patient_name: str | None = None
    insurance_provider: str | None = None
    insurance_policy_number: str | None = None
    created_at: datetime
    updated_at: datetime
