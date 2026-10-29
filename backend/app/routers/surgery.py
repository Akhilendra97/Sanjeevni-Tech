from __future__ import annotations
from app.core.dependencies import require_permission

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.surgery import (
    SurgeryCreate,
    SurgeryResponse,
    SurgeryUpdate,
)
from app.services.surgery_service import SurgeryService


router = APIRouter(
    prefix="/surgeries",
    tags=["Surgeries"],
)


@router.post(
    "",
    response_model=SurgeryResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_permission("surgery.manage"))],
)
def create_surgery(
    data: SurgeryCreate,
    db: Session = Depends(get_db),
):
    return SurgeryService.create(
        db,
        data,
    )


@router.get(
    "",
    response_model=list[SurgeryResponse],
    dependencies=[Depends(require_permission("surgery.view"))],
)
def list_surgeries(
    patient_id: int | None = Query(default=None),
    operation_theatre_id: int | None = Query(default=None),
    department_id: int | None = Query(default=None),
    surgeon_id: int | None = Query(default=None),
    status_value: str | None = Query(default=None),
    surgery_type: str | None = Query(default=None),
    db: Session = Depends(get_db),
):
    return SurgeryService.list(
        db=db,
        patient_id=patient_id,
        operation_theatre_id=operation_theatre_id,
        department_id=department_id,
        surgeon_id=surgeon_id,
        status_value=status_value,
        surgery_type=surgery_type,
    )


@router.get(
    "/number/{surgery_number}",
    response_model=SurgeryResponse,
    dependencies=[Depends(require_permission("surgery.view"))],
)
def get_surgery_by_number(
    surgery_number: str,
    db: Session = Depends(get_db),
):
    return SurgeryService.get_by_number(
        db,
        surgery_number,
    )


@router.get(
    "/{surgery_id}",
    response_model=SurgeryResponse,
    dependencies=[Depends(require_permission("surgery.view"))],
)
def get_surgery(
    surgery_id: int,
    db: Session = Depends(get_db),
):
    return SurgeryService.get(
        db,
        surgery_id,
    )


@router.put(
    "/{surgery_id}",
    response_model=SurgeryResponse,
    dependencies=[Depends(require_permission("surgery.manage"))],
)
def update_surgery(
    surgery_id: int,
    data: SurgeryUpdate,
    db: Session = Depends(get_db),
):
    return SurgeryService.update(
        db,
        surgery_id,
        data,
    )


@router.patch(
    "/{surgery_id}/start",
    response_model=SurgeryResponse,
    dependencies=[Depends(require_permission("surgery.manage"))],
)
def start_surgery(
    surgery_id: int,
    db: Session = Depends(get_db),
):
    return SurgeryService.start(
        db,
        surgery_id,
    )


@router.patch(
    "/{surgery_id}/complete",
    response_model=SurgeryResponse,
    dependencies=[Depends(require_permission("surgery.manage"))],
)
def complete_surgery(
    surgery_id: int,
    db: Session = Depends(get_db),
):
    return SurgeryService.complete(
        db,
        surgery_id,
    )


@router.patch(
    "/{surgery_id}/cancel",
    response_model=SurgeryResponse,
    dependencies=[Depends(require_permission("surgery.manage"))],
)
def cancel_surgery(
    surgery_id: int,
    cancellation_reason: str = Query(..., min_length=1),
    db: Session = Depends(get_db),
):
    return SurgeryService.cancel(
        db,
        surgery_id,
        cancellation_reason,
    )


@router.delete(
    "/{surgery_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(require_permission("surgery.manage"))],
)
def delete_surgery(
    surgery_id: int,
    db: Session = Depends(get_db),
):
    SurgeryService.delete(
        db,
        surgery_id,
    )

    return None
