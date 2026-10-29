from __future__ import annotations

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.insurance import (
    InsuranceCreate,
    InsuranceResponse,
    InsuranceUpdate,
)
from app.services.insurance_service import InsuranceService


router = APIRouter(
    prefix="/insurance",
    tags=["Insurance Management"],
)


@router.post(
    "",
    response_model=InsuranceResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_insurance(
    data: InsuranceCreate,
    db: Session = Depends(get_db),
):
    return InsuranceService.create(db, data)


@router.get(
    "",
    response_model=list[InsuranceResponse],
)
def list_insurance(
    patient_id: int | None = Query(default=None),
    insurance_provider: str | None = Query(default=None),
    policy_type: str | None = Query(default=None),
    status_value: str | None = Query(default=None),
    is_primary: bool | None = Query(default=None),
    db: Session = Depends(get_db),
):
    return InsuranceService.list(
        db,
        patient_id=patient_id,
        insurance_provider=insurance_provider,
        policy_type=policy_type,
        status_value=status_value,
        is_primary=is_primary,
    )


@router.get(
    "/policy/{policy_number}",
    response_model=InsuranceResponse,
)
def get_insurance_by_policy_number(
    policy_number: str,
    db: Session = Depends(get_db),
):
    return InsuranceService.get_by_policy_number(
        db,
        policy_number,
    )


@router.get(
    "/{insurance_id}",
    response_model=InsuranceResponse,
)
def get_insurance(
    insurance_id: int,
    db: Session = Depends(get_db),
):
    return InsuranceService.get(
        db,
        insurance_id,
    )


@router.put(
    "/{insurance_id}",
    response_model=InsuranceResponse,
)
def update_insurance(
    insurance_id: int,
    data: InsuranceUpdate,
    db: Session = Depends(get_db),
):
    return InsuranceService.update(
        db,
        insurance_id,
        data,
    )


@router.delete(
    "/{insurance_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_insurance(
    insurance_id: int,
    db: Session = Depends(get_db),
):
    InsuranceService.delete(
        db,
        insurance_id,
    )
    return None
