from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.equipment import (
    EquipmentCreate,
    EquipmentUpdate,
    EquipmentResponse,
)
from app.services.equipment_service import (
    create_equipment,
    get_equipment_by_id,
    list_equipment,
    list_active_equipment,
    update_equipment,
    delete_equipment,
)


router = APIRouter(
    prefix="/equipment",
    tags=["Equipment"],
)


@router.post(
    "",
    response_model=EquipmentResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_equipment_endpoint(
    data: EquipmentCreate,
    db: Session = Depends(get_db),
):
    try:
        return create_equipment(
            db=db,
            data=data,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(exc),
        ) from exc


@router.get(
    "",
    response_model=list[EquipmentResponse],
    status_code=status.HTTP_200_OK,
)
def get_all_equipment(
    db: Session = Depends(get_db),
):
    return list_equipment(db)


@router.get(
    "/active",
    response_model=list[EquipmentResponse],
    status_code=status.HTTP_200_OK,
)
def get_active_equipment(
    db: Session = Depends(get_db),
):
    return list_active_equipment(db)


@router.get(
    "/{equipment_id}",
    response_model=EquipmentResponse,
    status_code=status.HTTP_200_OK,
)
def get_equipment(
    equipment_id: int,
    db: Session = Depends(get_db),
):
    equipment = get_equipment_by_id(
        db=db,
        equipment_id=equipment_id,
    )

    if equipment is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Equipment not found.",
        )

    return equipment


@router.put(
    "/{equipment_id}",
    response_model=EquipmentResponse,
    status_code=status.HTTP_200_OK,
)
def update_equipment_endpoint(
    equipment_id: int,
    data: EquipmentUpdate,
    db: Session = Depends(get_db),
):
    equipment = get_equipment_by_id(
        db=db,
        equipment_id=equipment_id,
    )

    if equipment is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Equipment not found.",
        )

    try:
        return update_equipment(
            db=db,
            equipment=equipment,
            data=data,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(exc),
        ) from exc


@router.delete(
    "/{equipment_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_equipment_endpoint(
    equipment_id: int,
    db: Session = Depends(get_db),
):
    equipment = get_equipment_by_id(
        db=db,
        equipment_id=equipment_id,
    )

    if equipment is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Equipment not found.",
        )

    delete_equipment(
        db=db,
        equipment=equipment,
    )

    return None
