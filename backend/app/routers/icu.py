from __future__ import annotations

from datetime import datetime

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.icu import ICUCreate, ICUResponse, ICUUpdate
from app.services.icu_service import ICUService


router = APIRouter(
    prefix="/icu",
    tags=["ICU Management"],
)


@router.post(
    "",
    response_model=ICUResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_icu(
    data: ICUCreate,
    db: Session = Depends(get_db),
):
    return ICUService.create(db, data)


@router.get(
    "",
    response_model=list[ICUResponse],
)
def list_icu(
    patient_id: int | None = Query(default=None),
    doctor_id: int | None = Query(default=None),
    nurse_id: int | None = Query(default=None),
    ward_id: int | None = Query(default=None),
    bed_id: int | None = Query(default=None),
    status_value: str | None = Query(default=None),
    icu_type: str | None = Query(default=None),
    ventilator_required: bool | None = Query(default=None),
    db: Session = Depends(get_db),
):
    return ICUService.list(
        db,
        patient_id=patient_id,
        doctor_id=doctor_id,
        nurse_id=nurse_id,
        ward_id=ward_id,
        bed_id=bed_id,
        status_value=status_value,
        icu_type=icu_type,
        ventilator_required=ventilator_required,
    )


@router.get(
    "/number/{icu_number}",
    response_model=ICUResponse,
)
def get_icu_by_number(
    icu_number: str,
    db: Session = Depends(get_db),
):
    return ICUService.get_by_number(db, icu_number)


@router.get(
    "/{icu_id}",
    response_model=ICUResponse,
)
def get_icu(
    icu_id: int,
    db: Session = Depends(get_db),
):
    return ICUService.get(db, icu_id)


@router.put(
    "/{icu_id}",
    response_model=ICUResponse,
)
def update_icu(
    icu_id: int,
    data: ICUUpdate,
    db: Session = Depends(get_db),
):
    return ICUService.update(db, icu_id, data)


@router.patch(
    "/{icu_id}/discharge",
    response_model=ICUResponse,
)
def discharge_icu(
    icu_id: int,
    discharge_time: datetime | None = Query(default=None),
    db: Session = Depends(get_db),
):
    return ICUService.discharge(
        db,
        icu_id,
        discharge_time,
    )


@router.delete(
    "/{icu_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_icu(
    icu_id: int,
    db: Session = Depends(get_db),
):
    ICUService.delete(db, icu_id)
    return None
