from __future__ import annotations
from app.core.dependencies import require_permission

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.insurance_claim import (
    InsuranceClaimCreate,
    InsuranceClaimResponse,
    InsuranceClaimUpdate,
)
from app.services.insurance_claim_service import InsuranceClaimService


router = APIRouter(
    prefix="/insurance-claims",
    tags=["Insurance Claim Management"],
)


@router.post(
    "",
    response_model=InsuranceClaimResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_permission("insurance.manage"))],
)
def create_insurance_claim(
    data: InsuranceClaimCreate,
    db: Session = Depends(get_db),
):
    return InsuranceClaimService.create(
        db,
        data,
    )


@router.get(
    "",
    response_model=list[InsuranceClaimResponse],
    dependencies=[Depends(require_permission("insurance.view"))],
)
def list_insurance_claims(
    insurance_id: int | None = Query(default=None),
    patient_id: int | None = Query(default=None),
    admission_id: int | None = Query(default=None),
    status_value: str | None = Query(default=None),
    db: Session = Depends(get_db),
):
    return InsuranceClaimService.list(
        db,
        insurance_id=insurance_id,
        patient_id=patient_id,
        admission_id=admission_id,
        status_value=status_value,
    )


@router.get(
    "/number/{claim_number}",
    response_model=InsuranceClaimResponse,
    dependencies=[Depends(require_permission("insurance.view"))],
)
def get_insurance_claim_by_number(
    claim_number: str,
    db: Session = Depends(get_db),
):
    return InsuranceClaimService.get_by_claim_number(
        db,
        claim_number,
    )


@router.get(
    "/{claim_id}",
    response_model=InsuranceClaimResponse,
    dependencies=[Depends(require_permission("insurance.view"))],
)
def get_insurance_claim(
    claim_id: int,
    db: Session = Depends(get_db),
):
    return InsuranceClaimService.get(
        db,
        claim_id,
    )


@router.put(
    "/{claim_id}",
    response_model=InsuranceClaimResponse,
    dependencies=[Depends(require_permission("insurance.manage"))],
)
def update_insurance_claim(
    claim_id: int,
    data: InsuranceClaimUpdate,
    db: Session = Depends(get_db),
):
    return InsuranceClaimService.update(
        db,
        claim_id,
        data,
    )


@router.delete(
    "/{claim_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(require_permission("insurance.manage"))],
)
def delete_insurance_claim(
    claim_id: int,
    db: Session = Depends(get_db),
):
    InsuranceClaimService.delete(
        db,
        claim_id,
    )
    return None
