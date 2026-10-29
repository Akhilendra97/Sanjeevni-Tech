from __future__ import annotations

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.operation_theatre import (
    OperationTheatreCreate,
    OperationTheatreResponse,
    OperationTheatreUpdate,
)
from app.services.operation_theatre_service import OperationTheatreService


router = APIRouter(
    prefix="/operation-theatres",
    tags=["Operation Theatres"],
)


@router.post(
    "",
    response_model=OperationTheatreResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_operation_theatre(
    data: OperationTheatreCreate,
    db: Session = Depends(get_db),
):
    return OperationTheatreService.create(db, data)


@router.get(
    "",
    response_model=list[OperationTheatreResponse],
)
def list_operation_theatres(
    department_id: int | None = Query(default=None),
    patient_id: int | None = Query(default=None),
    surgeon_id: int | None = Query(default=None),
    status_value: str | None = Query(default=None),
    surgery_type: str | None = Query(default=None),
    db: Session = Depends(get_db),
):
    return OperationTheatreService.list(
        db=db,
        department_id=department_id,
        patient_id=patient_id,
        surgeon_id=surgeon_id,
        status_value=status_value,
        surgery_type=surgery_type,
    )


@router.get(
    "/number/{ot_number}",
    response_model=OperationTheatreResponse,
)
def get_operation_theatre_by_number(
    ot_number: str,
    db: Session = Depends(get_db),
):
    return OperationTheatreService.get_by_number(
        db,
        ot_number,
    )


@router.get(
    "/{operation_id}",
    response_model=OperationTheatreResponse,
)
def get_operation_theatre(
    operation_id: int,
    db: Session = Depends(get_db),
):
    return OperationTheatreService.get(
        db,
        operation_id,
    )


@router.put(
    "/{operation_id}",
    response_model=OperationTheatreResponse,
)
def update_operation_theatre(
    operation_id: int,
    data: OperationTheatreUpdate,
    db: Session = Depends(get_db),
):
    return OperationTheatreService.update(
        db,
        operation_id,
        data,
    )


@router.patch(
    "/{operation_id}/start",
    response_model=OperationTheatreResponse,
)
def start_operation(
    operation_id: int,
    db: Session = Depends(get_db),
):
    return OperationTheatreService.start(
        db,
        operation_id,
    )


@router.patch(
    "/{operation_id}/complete",
    response_model=OperationTheatreResponse,
)
def complete_operation(
    operation_id: int,
    db: Session = Depends(get_db),
):
    return OperationTheatreService.complete(
        db,
        operation_id,
    )


@router.patch(
    "/{operation_id}/cancel",
    response_model=OperationTheatreResponse,
)
def cancel_operation(
    operation_id: int,
    cancellation_reason: str = Query(..., min_length=1),
    db: Session = Depends(get_db),
):
    return OperationTheatreService.cancel(
        db,
        operation_id,
        cancellation_reason,
    )


@router.delete(
    "/{operation_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_operation_theatre(
    operation_id: int,
    db: Session = Depends(get_db),
):
    OperationTheatreService.delete(
        db,
        operation_id,
    )
    return None
