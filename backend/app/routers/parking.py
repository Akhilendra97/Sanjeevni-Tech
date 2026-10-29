from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.parking import (
    ParkingCreate,
    ParkingResponse,
    ParkingUpdate,
)
from app.services import parking_service


router = APIRouter(
    prefix="/parkings",
    tags=["Parking Management"],
)


@router.post(
    "",
    response_model=ParkingResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_parking(
    parking_data: ParkingCreate,
    db: Session = Depends(get_db),
):
    try:
        return parking_service.create_parking(
            db,
            parking_data,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        )


@router.get(
    "",
    response_model=list[ParkingResponse],
)
def list_parkings(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=500),
    status_filter: str | None = Query(
        default=None,
        alias="status",
    ),
    vehicle_type: str | None = None,
    payment_status: str | None = None,
    db: Session = Depends(get_db),
):
    try:
        return parking_service.list_parkings(
            db=db,
            skip=skip,
            limit=limit,
            status=status_filter,
            vehicle_type=vehicle_type,
            payment_status=payment_status,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        )


@router.get(
    "/number/{parking_number}",
    response_model=ParkingResponse,
)
def get_parking_by_number(
    parking_number: str,
    db: Session = Depends(get_db),
):
    parking = parking_service.get_parking_by_number(
        db,
        parking_number,
    )

    if parking is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Parking record not found",
        )

    return parking


@router.get(
    "/{parking_id}",
    response_model=ParkingResponse,
)
def get_parking(
    parking_id: int,
    db: Session = Depends(get_db),
):
    parking = parking_service.get_parking(
        db,
        parking_id,
    )

    if parking is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Parking record not found",
        )

    return parking


@router.put(
    "/{parking_id}",
    response_model=ParkingResponse,
)
def update_parking(
    parking_id: int,
    parking_data: ParkingUpdate,
    db: Session = Depends(get_db),
):
    try:
        parking = parking_service.update_parking(
            db,
            parking_id,
            parking_data,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        )

    if parking is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Parking record not found",
        )

    return parking


@router.patch(
    "/{parking_id}/exit",
    response_model=ParkingResponse,
)
def exit_parking(
    parking_id: int,
    exit_time: datetime | None = None,
    db: Session = Depends(get_db),
):
    try:
        parking = parking_service.exit_parking(
            db,
            parking_id,
            exit_time,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        )

    if parking is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Parking record not found",
        )

    return parking


@router.patch(
    "/{parking_id}/pay",
    response_model=ParkingResponse,
)
def mark_payment_paid(
    parking_id: int,
    db: Session = Depends(get_db),
):
    parking = parking_service.mark_payment_paid(
        db,
        parking_id,
    )

    if parking is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Parking record not found",
        )

    return parking


@router.patch(
    "/{parking_id}/cancel",
    response_model=ParkingResponse,
)
def cancel_parking(
    parking_id: int,
    db: Session = Depends(get_db),
):
    try:
        parking = parking_service.cancel_parking(
            db,
            parking_id,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        )

    if parking is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Parking record not found",
        )

    return parking


@router.delete(
    "/{parking_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_parking(
    parking_id: int,
    db: Session = Depends(get_db),
):
    deleted = parking_service.delete_parking(
        db,
        parking_id,
    )

    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Parking record not found",
        )

    return None
