from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.leave import (
    LeaveCreate,
    LeaveResponse,
    LeaveUpdate,
)
from app.services.leave_service import LeaveService


router = APIRouter(
    prefix="/leaves",
    tags=["Leave Management"],
)


@router.post(
    "",
    response_model=LeaveResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_leave(
    data: LeaveCreate,
    db: Session = Depends(get_db),
):
    return LeaveService.create(
        db,
        data,
    )


@router.get(
    "",
    response_model=list[LeaveResponse],
)
def list_leaves(
    employee_id: int | None = Query(default=None),
    leave_type: str | None = Query(default=None),
    leave_status: str | None = Query(default=None),
    db: Session = Depends(get_db),
):
    return LeaveService.list(
        db,
        employee_id=employee_id,
        leave_type=leave_type,
        leave_status=leave_status,
    )


@router.get(
    "/number/{leave_number}",
    response_model=LeaveResponse,
)
def get_leave_by_number(
    leave_number: str,
    db: Session = Depends(get_db),
):
    return LeaveService.get_by_number(
        db,
        leave_number,
    )


@router.get(
    "/{leave_id}",
    response_model=LeaveResponse,
)
def get_leave(
    leave_id: int,
    db: Session = Depends(get_db),
):
    return LeaveService.get(
        db,
        leave_id,
    )


@router.put(
    "/{leave_id}",
    response_model=LeaveResponse,
)
def update_leave(
    leave_id: int,
    data: LeaveUpdate,
    db: Session = Depends(get_db),
):
    return LeaveService.update(
        db,
        leave_id,
        data,
    )


@router.patch(
    "/{leave_id}/approve",
    response_model=LeaveResponse,
)
def approve_leave(
    leave_id: int,
    approved_by: int,
    remarks: str | None = None,
    db: Session = Depends(get_db),
):
    return LeaveService.approve(
        db,
        leave_id,
        approved_by,
        remarks,
    )


@router.patch(
    "/{leave_id}/reject",
    response_model=LeaveResponse,
)
def reject_leave(
    leave_id: int,
    approved_by: int,
    remarks: str | None = None,
    db: Session = Depends(get_db),
):
    return LeaveService.reject(
        db,
        leave_id,
        approved_by,
        remarks,
    )


@router.patch(
    "/{leave_id}/cancel",
    response_model=LeaveResponse,
)
def cancel_leave(
    leave_id: int,
    remarks: str | None = None,
    db: Session = Depends(get_db),
):
    return LeaveService.cancel(
        db,
        leave_id,
        remarks,
    )


@router.delete(
    "/{leave_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_leave(
    leave_id: int,
    db: Session = Depends(get_db),
):
    LeaveService.delete(
        db,
        leave_id,
    )
    return None
