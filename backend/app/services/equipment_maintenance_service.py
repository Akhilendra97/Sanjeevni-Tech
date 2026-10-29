from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.equipment_maintenance import EquipmentMaintenance
from app.models.equipment import Equipment
from app.schemas.equipment_maintenance import (
    EquipmentMaintenanceCreate,
    EquipmentMaintenanceUpdate,
)


def create_equipment_maintenance(
    db: Session,
    data: EquipmentMaintenanceCreate,
) -> EquipmentMaintenance:

    equipment = db.get(Equipment, data.equipment_id)

    if equipment is None:
        raise ValueError("Equipment not found.")

    maintenance = EquipmentMaintenance(
        equipment_id=data.equipment_id,
        maintenance_type=data.maintenance_type,
        maintenance_date=data.maintenance_date,
        description=data.description,
        performed_by=data.performed_by,
        status=data.status,
        next_maintenance_date=data.next_maintenance_date,
        cost=data.cost,
        notes=data.notes,
    )

    db.add(maintenance)
    db.commit()
    db.refresh(maintenance)

    return maintenance


def get_equipment_maintenance_by_id(
    db: Session,
    maintenance_id: int,
) -> EquipmentMaintenance | None:

    return db.get(
        EquipmentMaintenance,
        maintenance_id,
    )


def list_equipment_maintenance(
    db: Session,
) -> list[EquipmentMaintenance]:

    statement = select(
        EquipmentMaintenance
    ).order_by(
        EquipmentMaintenance.maintenance_date.desc(),
        EquipmentMaintenance.id.desc(),
    )

    return list(
        db.scalars(statement).all()
    )


def list_equipment_maintenance_by_equipment(
    db: Session,
    equipment_id: int,
) -> list[EquipmentMaintenance]:

    statement = (
        select(EquipmentMaintenance)
        .where(
            EquipmentMaintenance.equipment_id == equipment_id
        )
        .order_by(
            EquipmentMaintenance.maintenance_date.desc(),
            EquipmentMaintenance.id.desc(),
        )
    )

    return list(
        db.scalars(statement).all()
    )


def update_equipment_maintenance(
    db: Session,
    maintenance: EquipmentMaintenance,
    data: EquipmentMaintenanceUpdate,
) -> EquipmentMaintenance:

    update_data = data.model_dump(
        exclude_unset=True
    )

    for field, value in update_data.items():
        setattr(
            maintenance,
            field,
            value,
        )

    db.commit()
    db.refresh(maintenance)

    return maintenance


def delete_equipment_maintenance(
    db: Session,
    maintenance: EquipmentMaintenance,
) -> None:

    db.delete(maintenance)
    db.commit()
