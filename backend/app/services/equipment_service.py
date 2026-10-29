from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.equipment import Equipment
from app.schemas.equipment import (
    EquipmentCreate,
    EquipmentUpdate,
)


def create_equipment(
    db: Session,
    data: EquipmentCreate,
) -> Equipment:

    existing_code = db.scalar(
        select(Equipment).where(
            Equipment.equipment_code == data.equipment_code
        )
    )

    if existing_code is not None:
        raise ValueError(
            "Equipment code already exists."
        )

    if data.serial_number:
        existing_serial = db.scalar(
            select(Equipment).where(
                Equipment.serial_number == data.serial_number
            )
        )

        if existing_serial is not None:
            raise ValueError(
                "Serial number already exists."
            )

    equipment = Equipment(
        equipment_code=data.equipment_code,
        name=data.name,
        category=data.category,
        manufacturer=data.manufacturer,
        model_number=data.model_number,
        serial_number=data.serial_number,
        purchase_date=data.purchase_date,
        purchase_cost=data.purchase_cost,
        warranty_expiry=data.warranty_expiry,
        location=data.location,
        department_id=data.department_id,
        status=data.status,
        description=data.description,
        is_active=data.is_active,
    )

    db.add(equipment)
    db.commit()
    db.refresh(equipment)

    return equipment


def get_equipment_by_id(
    db: Session,
    equipment_id: int,
) -> Equipment | None:

    return db.get(
        Equipment,
        equipment_id,
    )


def list_equipment(
    db: Session,
) -> list[Equipment]:

    statement = (
        select(Equipment)
        .order_by(
            Equipment.name.asc(),
            Equipment.id.desc(),
        )
    )

    return list(
        db.scalars(statement).all()
    )


def list_active_equipment(
    db: Session,
) -> list[Equipment]:

    statement = (
        select(Equipment)
        .where(
            Equipment.is_active.is_(True)
        )
        .order_by(
            Equipment.name.asc(),
            Equipment.id.desc(),
        )
    )

    return list(
        db.scalars(statement).all()
    )


def update_equipment(
    db: Session,
    equipment: Equipment,
    data: EquipmentUpdate,
) -> Equipment:

    update_data = data.model_dump(
        exclude_unset=True
    )

    if "equipment_code" in update_data:
        existing_code = db.scalar(
            select(Equipment).where(
                Equipment.equipment_code
                == update_data["equipment_code"],
                Equipment.id != equipment.id,
            )
        )

        if existing_code is not None:
            raise ValueError(
                "Equipment code already exists."
            )

    if (
        "serial_number" in update_data
        and update_data["serial_number"]
    ):
        existing_serial = db.scalar(
            select(Equipment).where(
                Equipment.serial_number
                == update_data["serial_number"],
                Equipment.id != equipment.id,
            )
        )

        if existing_serial is not None:
            raise ValueError(
                "Serial number already exists."
            )

    for field, value in update_data.items():
        setattr(
            equipment,
            field,
            value,
        )

    db.commit()
    db.refresh(equipment)

    return equipment


def delete_equipment(
    db: Session,
    equipment: Equipment,
) -> None:

    db.delete(equipment)
    db.commit()
