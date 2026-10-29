from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.inventory import Inventory
from app.models.medicine import Medicine
from app.schemas.inventory import (
    InventoryCreate,
    InventoryUpdate,
)


def _sync_medicine_stock(
    medicine: Medicine,
    inventory: Inventory,
) -> None:
    medicine.stock_quantity = inventory.quantity


def create_inventory(
    db: Session,
    data: InventoryCreate,
) -> Inventory:
    medicine = db.scalar(
        select(Medicine).where(
            Medicine.id == data.medicine_id
        )
    )

    if medicine is None:
        raise ValueError("Medicine not found.")

    existing_inventory = db.scalar(
        select(Inventory).where(
            Inventory.medicine_id == data.medicine_id
        )
    )

    if existing_inventory is not None:
        raise ValueError(
            "Inventory already exists for this medicine."
        )

    if (
        data.maximum_stock is not None
        and data.maximum_stock < data.minimum_stock
    ):
        raise ValueError(
            "Maximum stock cannot be lower than minimum stock."
        )

    if data.reserved_quantity > data.quantity:
        raise ValueError(
            "Reserved quantity cannot exceed available quantity."
        )

    inventory = Inventory(
        medicine_id=data.medicine_id,
        quantity=data.quantity,
        reserved_quantity=data.reserved_quantity,
        minimum_stock=data.minimum_stock,
        maximum_stock=data.maximum_stock,
        unit_cost=data.unit_cost,
        location=data.location,
        batch_number=data.batch_number,
        expiry_date=data.expiry_date,
        status=data.status,
        notes=data.notes,
    )

    db.add(inventory)

    _sync_medicine_stock(medicine, inventory)

    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise ValueError(
            "Inventory violates a database constraint."
        ) from exc

    db.refresh(inventory)

    return inventory


def get_inventory_by_id(
    db: Session,
    inventory_id: int,
) -> Inventory | None:
    return db.scalar(
        select(Inventory).where(
            Inventory.id == inventory_id
        )
    )


def get_inventory_by_medicine(
    db: Session,
    medicine_id: int,
) -> Inventory | None:
    return db.scalar(
        select(Inventory).where(
            Inventory.medicine_id == medicine_id
        )
    )


def list_inventory(
    db: Session,
) -> list[Inventory]:
    statement = (
        select(Inventory)
        .order_by(Inventory.id.desc())
    )

    return list(db.scalars(statement).all())


def list_low_stock_inventory(
    db: Session,
) -> list[Inventory]:
    statement = (
        select(Inventory)
        .where(
            Inventory.quantity
            <= Inventory.minimum_stock
        )
        .order_by(Inventory.quantity.asc())
    )

    return list(db.scalars(statement).all())


def list_available_inventory(
    db: Session,
) -> list[Inventory]:
    statement = (
        select(Inventory)
        .where(
            Inventory.status == "available"
        )
        .order_by(Inventory.id.desc())
    )

    return list(db.scalars(statement).all())


def update_inventory(
    db: Session,
    inventory: Inventory,
    data: InventoryUpdate,
) -> Inventory:
    update_data = data.model_dump(
        exclude_unset=True
    )

    new_quantity = update_data.get(
        "quantity",
        inventory.quantity,
    )

    new_reserved_quantity = update_data.get(
        "reserved_quantity",
        inventory.reserved_quantity,
    )

    new_minimum_stock = update_data.get(
        "minimum_stock",
        inventory.minimum_stock,
    )

    new_maximum_stock = update_data.get(
        "maximum_stock",
        inventory.maximum_stock,
    )

    if new_reserved_quantity > new_quantity:
        raise ValueError(
            "Reserved quantity cannot exceed available quantity."
        )

    if (
        new_maximum_stock is not None
        and new_maximum_stock < new_minimum_stock
    ):
        raise ValueError(
            "Maximum stock cannot be lower than minimum stock."
        )

    for field, value in update_data.items():
        setattr(
            inventory,
            field,
            value,
        )

    medicine = db.scalar(
        select(Medicine).where(
            Medicine.id == inventory.medicine_id
        )
    )

    if medicine is None:
        raise ValueError("Medicine not found.")

    _sync_medicine_stock(medicine, inventory)

    db.commit()
    db.refresh(inventory)

    return inventory


def adjust_inventory_quantity(
    db: Session,
    inventory: Inventory,
    quantity_change: int,
) -> Inventory:
    if quantity_change == 0:
        raise ValueError(
            "Quantity change cannot be zero."
        )

    new_quantity = (
        inventory.quantity
        + quantity_change
    )

    if new_quantity < 0:
        raise ValueError(
            "Inventory quantity cannot become negative."
        )

    if (
        inventory.reserved_quantity
        > new_quantity
    ):
        raise ValueError(
            "New quantity cannot be lower than reserved quantity."
        )

    inventory.quantity = new_quantity

    medicine = db.scalar(
        select(Medicine).where(
            Medicine.id == inventory.medicine_id
        )
    )

    if medicine is None:
        raise ValueError("Medicine not found.")

    _sync_medicine_stock(medicine, inventory)

    db.commit()
    db.refresh(inventory)

    return inventory


def reserve_inventory(
    db: Session,
    inventory: Inventory,
    quantity: int,
) -> Inventory:
    if quantity <= 0:
        raise ValueError(
            "Reservation quantity must be greater than zero."
        )

    available_quantity = (
        inventory.quantity
        - inventory.reserved_quantity
    )

    if quantity > available_quantity:
        raise ValueError(
            "Insufficient available inventory."
        )

    inventory.reserved_quantity += quantity

    db.commit()
    db.refresh(inventory)

    return inventory


def release_inventory(
    db: Session,
    inventory: Inventory,
    quantity: int,
) -> Inventory:
    if quantity <= 0:
        raise ValueError(
            "Release quantity must be greater than zero."
        )

    if quantity > inventory.reserved_quantity:
        raise ValueError(
            "Release quantity exceeds reserved quantity."
        )

    inventory.reserved_quantity -= quantity

    db.commit()
    db.refresh(inventory)

    return inventory


def delete_inventory(
    db: Session,
    inventory: Inventory,
) -> None:
    medicine = db.scalar(
        select(Medicine).where(
            Medicine.id == inventory.medicine_id
        )
    )

    if medicine is not None:
        medicine.stock_quantity = 0

    db.delete(inventory)
    db.commit()
