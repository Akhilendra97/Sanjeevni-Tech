from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.visitor import (
    VisitorCreate,
    VisitorResponse,
    VisitorUpdate,
)
from app.services import visitor_service


router = APIRouter(
    prefix="/visitors",
    tags=["Visitor Management"],
)


@router.post(
    "",
    response_model=VisitorResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_visitor(
    visitor_data: VisitorCreate,
    db: Session = Depends(get_db),
):
    try:
        return visitor_service.create_visitor(
            db,
            visitor_data,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        )


@router.get(
    "",
    response_model=list[VisitorResponse],
)
def list_visitors(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=500),
    status_filter: str | None = Query(
        default=None,
        alias="status",
    ),
    patient_id: int | None = None,
    db: Session = Depends(get_db),
):
    try:
        return visitor_service.list_visitors(
            db=db,
            skip=skip,
            limit=limit,
            status=status_filter,
            patient_id=patient_id,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        )


@router.get(
    "/number/{visitor_number}",
    response_model=VisitorResponse,
)
def get_visitor_by_number(
    visitor_number: str,
    db: Session = Depends(get_db),
):
    visitor = visitor_service.get_visitor_by_number(
        db,
        visitor_number,
    )

    if visitor is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Visitor not found",
        )

    return visitor


@router.get(
    "/{visitor_id}",
    response_model=VisitorResponse,
)
def get_visitor(
    visitor_id: int,
    db: Session = Depends(get_db),
):
    visitor = visitor_service.get_visitor(
        db,
        visitor_id,
    )

    if visitor is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Visitor not found",
        )

    return visitor


@router.put(
    "/{visitor_id}",
    response_model=VisitorResponse,
)
def update_visitor(
    visitor_id: int,
    visitor_data: VisitorUpdate,
    db: Session = Depends(get_db),
):
    try:
        visitor = visitor_service.update_visitor(
            db,
            visitor_id,
            visitor_data,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        )

    if visitor is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Visitor not found",
        )

    return visitor


@router.patch(
    "/{visitor_id}/check-in",
    response_model=VisitorResponse,
)
def check_in_visitor(
    visitor_id: int,
    entry_time: datetime | None = None,
    db: Session = Depends(get_db),
):
    try:
        visitor = visitor_service.check_in_visitor(
            db,
            visitor_id,
            entry_time,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        )

    if visitor is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Visitor not found",
        )

    return visitor


@router.patch(
    "/{visitor_id}/check-out",
    response_model=VisitorResponse,
)
def check_out_visitor(
    visitor_id: int,
    exit_time: datetime | None = None,
    db: Session = Depends(get_db),
):
    try:
        visitor = visitor_service.check_out_visitor(
            db,
            visitor_id,
            exit_time,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        )

    if visitor is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Visitor not found",
        )

    return visitor


@router.patch(
    "/{visitor_id}/cancel",
    response_model=VisitorResponse,
)
def cancel_visitor(
    visitor_id: int,
    db: Session = Depends(get_db),
):
    try:
        visitor = visitor_service.cancel_visitor(
            db,
            visitor_id,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        )

    if visitor is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Visitor not found",
        )

    return visitor


@router.delete(
    "/{visitor_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_visitor(
    visitor_id: int,
    db: Session = Depends(get_db),
):
    deleted = visitor_service.delete_visitor(
        db,
        visitor_id,
    )

    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Visitor not found",
        )

    return None
