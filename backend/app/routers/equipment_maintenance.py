from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.equipment_maintenance import EquipmentMaintenance
from app.schemas.equipment_maintenance import (
    EquipmentMaintenanceCreate,
    EquipmentMaintenanceResponse,
    EquipmentMaintenanceUpdate,
)
from app.services.equipment_maintenance_service import (
    create_equipment_maintenance,
    delete_equipment_maintenance,
    get_equipment_maintenance_by_id,
    list_equipment_maintenance,
    list_equipment_maintenance_by_equipment,
    update_equipment_maintenance,
)


router = APIRouter(
    prefix="/equipment-maintenance",
    tags=["Equipment Maintenance"],
)


@router.post(
    "",
    response_model=EquipmentMaintenanceResponse,
    status_code=status.HTTP_201_CREATED,
)
def create(
    request: EquipmentMaintenanceCreate,
    db: Session = Depends(get_db),
) -> EquipmentMaintenance:

    try:
        return create_equipment_maintenance(
            db,
            request,
        )

    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc


@router.get(
    "",
    response_model=list[EquipmentMaintenanceResponse],
)
def get_all(
    db: Session = Depends(get_db),
) -> list[EquipmentMaintenance]:

    return list_equipment_maintenance(db)


@router.get(
    "/equipment/{equipment_id}",
    response_model=list[EquipmentMaintenanceResponse],
)
def get_by_equipment(
    equipment_id: int,
    db: Session = Depends(get_db),
) -> list[EquipmentMaintenance]:

    if equipment_id <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid equipment ID.",
        )

    return list_equipment_maintenance_by_equipment(
        db,
        equipment_id,
    )


@router.get(
    "/{maintenance_id}",
    response_model=EquipmentMaintenanceResponse,
)
def get_one(
    maintenance_id: int,
    db: Session = Depends(get_db),
) -> EquipmentMaintenance:

    maintenance = get_equipment_maintenance_by_id(
        db,
        maintenance_id,
    )

    if maintenance is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Equipment maintenance record not found.",
        )

    return maintenance


@router.patch(
    "/{maintenance_id}",
    response_model=EquipmentMaintenanceResponse,
)
def update(
    maintenance_id: int,
    request: EquipmentMaintenanceUpdate,
    db: Session = Depends(get_db),
) -> EquipmentMaintenance:

    maintenance = get_equipment_maintenance_by_id(
        db,
        maintenance_id,
    )

    if maintenance is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Equipment maintenance record not found.",
        )

    return update_equipment_maintenance(
        db,
        maintenance,
        request,
    )


@router.delete(
    "/{maintenance_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete(
    maintenance_id: int,
    db: Session = Depends(get_db),
) -> None:

    maintenance = get_equipment_maintenance_by_id(
        db,
        maintenance_id,
    )

    if maintenance is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Equipment maintenance record not found.",
        )

    delete_equipment_maintenance(
        db,
        maintenance,
    )
