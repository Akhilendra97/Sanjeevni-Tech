from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.ambulance import Ambulance
from app.schemas.ambulance import (
    AmbulanceCreate,
    AmbulanceResponse,
    AmbulanceUpdate,
)
from app.services.ambulance_service import (
    create_ambulance,
    delete_ambulance,
    get_ambulance_by_id,
    list_ambulances,
    update_ambulance,
)


router = APIRouter(
    prefix="/ambulances",
    tags=["Ambulances"],
)


@router.post(
    "",
    response_model=AmbulanceResponse,
    status_code=status.HTTP_201_CREATED,
)
def create(
    request: AmbulanceCreate,
    db: Session = Depends(get_db),
) -> Ambulance:

    try:
        return create_ambulance(
            db,
            ambulance_number=request.ambulance_number,
            registration_number=request.registration_number,
            ambulance_type=request.ambulance_type,
            department_id=request.department_id,
            driver_name=request.driver_name,
            driver_phone=request.driver_phone,
            equipment_details=request.equipment_details,
            status=request.status,
            location=request.location,
            is_active=request.is_active,
            notes=request.notes,
        )

    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc


@router.get(
    "",
    response_model=list[AmbulanceResponse],
)
def get_all(
    db: Session = Depends(get_db),
) -> list[Ambulance]:

    return list_ambulances(db)


@router.get(
    "/{ambulance_id}",
    response_model=AmbulanceResponse,
)
def get_one(
    ambulance_id: int,
    db: Session = Depends(get_db),
) -> Ambulance:

    ambulance = get_ambulance_by_id(
        db,
        ambulance_id,
    )

    if ambulance is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ambulance not found.",
        )

    return ambulance


@router.patch(
    "/{ambulance_id}",
    response_model=AmbulanceResponse,
)
def update(
    ambulance_id: int,
    request: AmbulanceUpdate,
    db: Session = Depends(get_db),
) -> Ambulance:

    ambulance = get_ambulance_by_id(
        db,
        ambulance_id,
    )

    if ambulance is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ambulance not found.",
        )

    try:
        return update_ambulance(
            db,
            ambulance,
            ambulance_number=request.ambulance_number,
            registration_number=request.registration_number,
            ambulance_type=request.ambulance_type,
            department_id=request.department_id,
            driver_name=request.driver_name,
            driver_phone=request.driver_phone,
            equipment_details=request.equipment_details,
            status=request.status,
            location=request.location,
            is_active=request.is_active,
            notes=request.notes,
        )

    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc


@router.delete(
    "/{ambulance_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete(
    ambulance_id: int,
    db: Session = Depends(get_db),
) -> None:

    ambulance = get_ambulance_by_id(
        db,
        ambulance_id,
    )

    if ambulance is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ambulance not found.",
        )

    delete_ambulance(
        db,
        ambulance,
    )