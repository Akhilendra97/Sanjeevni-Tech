from app.core.dependencies import require_permission
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.pharmacy_dispensing import (
    PharmacyDispensingCreate,
    PharmacyDispensingResponse,
)
from app.services.pharmacy_dispensing_service import (
    VALID_STATUSES,
    cancel_pharmacy_dispensing,
    create_pharmacy_dispensing,
    get_pharmacy_dispensing_by_id,
    get_pharmacy_dispensing_by_number,
    list_pharmacy_dispensings,
)


router = APIRouter(
    prefix="/pharmacy-dispensing",
    tags=["Pharmacy Dispensing"],
)


@router.post(
    "",
    response_model=PharmacyDispensingResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_permission("pharmacy.manage"))],
)
def create_dispensing(
    payload: PharmacyDispensingCreate,
    db: Session = Depends(get_db),
):
    try:
        return create_pharmacy_dispensing(
            db,
            dispensing_number=payload.dispensing_number,
            prescription_id=payload.prescription_id,
            patient_id=payload.patient_id,
            pharmacist_id=payload.pharmacist_id,
            items=payload.items,
            notes=payload.notes,
        )
    except ValueError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        )


@router.get(
    "",
    response_model=list[PharmacyDispensingResponse],
    dependencies=[Depends(require_permission("pharmacy.view"))],
)
def list_dispensings(
    patient_id: int | None = Query(
        default=None,
        gt=0,
    ),
    prescription_id: int | None = Query(
        default=None,
        gt=0,
    ),
    dispensing_status: str | None = Query(
        default=None,
        alias="status",
    ),
    db: Session = Depends(get_db),
):
    try:
        return list_pharmacy_dispensings(
            db,
            patient_id=patient_id,
            prescription_id=prescription_id,
            status=dispensing_status,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        )


@router.get(
    "/number/{dispensing_number}",
    response_model=PharmacyDispensingResponse,
    dependencies=[Depends(require_permission("pharmacy.view"))],
)
def get_dispensing_by_number(
    dispensing_number: str,
    db: Session = Depends(get_db),
):
    dispensing = get_pharmacy_dispensing_by_number(
        db,
        dispensing_number,
    )

    if dispensing is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pharmacy dispensing record not found.",
        )

    return dispensing


@router.get(
    "/{dispensing_id}",
    response_model=PharmacyDispensingResponse,
    dependencies=[Depends(require_permission("pharmacy.view"))],
)
def get_dispensing(
    dispensing_id: int,
    db: Session = Depends(get_db),
):
    dispensing = get_pharmacy_dispensing_by_id(
        db,
        dispensing_id,
    )

    if dispensing is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pharmacy dispensing record not found.",
        )

    return dispensing


@router.patch(
    "/{dispensing_id}/cancel",
    response_model=PharmacyDispensingResponse,
    dependencies=[Depends(require_permission("pharmacy.manage"))],
)
def cancel_dispensing(
    dispensing_id: int,
    db: Session = Depends(get_db),
):
    dispensing = get_pharmacy_dispensing_by_id(
        db,
        dispensing_id,
    )

    if dispensing is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pharmacy dispensing record not found.",
        )

    try:
        return cancel_pharmacy_dispensing(
            db,
            dispensing,
        )
    except ValueError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        )
