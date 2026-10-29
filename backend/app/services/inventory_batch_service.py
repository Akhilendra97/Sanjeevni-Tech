from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.inventory_batch import InventoryBatch
from app.models.medicine import Medicine
from app.schemas.inventory_batch import (
    InventoryBatchCreate,
    InventoryBatchQuantityAdjustment,
    InventoryBatchReservation,
    InventoryBatchUpdate,
)


def _sync_medicine_stock(
    db: Session,
    medicine_id: int,
) -> None:
    medicine = db.execute(
        select(Medicine)
        .where(Medicine.id == medicine_id)
        .with_for_update()
    ).scalar_one_or_none()

    if medicine is None:
        raise ValueError(
            f"Medicine {medicine_id} not found."
        )

    batches = db.execute(
        select(InventoryBatch)
        .where(
            InventoryBatch.medicine_id
            == medicine_id
        )
    ).scalars().all()

    medicine.stock_quantity = sum(
        batch.quantity
        for batch in batches
    )


def _update_batch_status(
    batch: InventoryBatch,
) -> None:
    available_quantity = (
        batch.quantity
        - batch.reserved_quantity
    )

    if batch.quantity <= 0:
        batch.status = "out_of_stock"

    elif (
        batch.expiry_date is not None
        and batch.expiry_date
        <= datetime.now(timezone.utc)
    ):
        batch.status = "expired"

    elif available_quantity <= 0:
        batch.status = "reserved"

    else:
        batch.status = "available"


def create_inventory_batch(
    db: Session,
    data: InventoryBatchCreate,
) -> InventoryBatch:
    medicine = db.execute(
        select(Medicine)
        .where(
            Medicine.id == data.medicine_id
        )
        .with_for_update()
    ).scalar_one_or_none()

    if medicine is None:
        raise ValueError(
            f"Medicine {data.medicine_id} not found."
        )

    existing_batch = db.execute(
        select(InventoryBatch)
        .where(
            InventoryBatch.medicine_id
            == data.medicine_id,
            InventoryBatch.batch_number
            == data.batch_number,
        )
        .with_for_update()
    ).scalar_one_or_none()

    if existing_batch is not None:
        raise ValueError(
            "This batch already exists for the medicine."
        )

    if (
        data.reserved_quantity
        > data.quantity
    ):
        raise ValueError(
            "Reserved quantity cannot exceed "
            "total quantity."
        )

    batch = InventoryBatch(
        medicine_id=data.medicine_id,
        batch_number=data.batch_number,
        quantity=data.quantity,
        reserved_quantity=data.reserved_quantity,
        unit_cost=data.unit_cost,
        expiry_date=data.expiry_date,
        location=data.location,
        status=data.status,
        notes=data.notes,
    )

    _update_batch_status(batch)

    db.add(batch)
    db.flush()

    _sync_medicine_stock(
        db,
        data.medicine_id,
    )

    db.flush()

    return batch


def get_inventory_batch_by_id(
    db: Session,
    batch_id: int,
) -> InventoryBatch | None:
    return db.execute(
        select(InventoryBatch)
        .where(
            InventoryBatch.id == batch_id
        )
    ).scalar_one_or_none()


def list_inventory_batches(
    db: Session,
    medicine_id: int | None = None,
    status: str | None = None,
    include_expired: bool = True,
) -> list[InventoryBatch]:
    query = select(InventoryBatch)

    if medicine_id is not None:
        query = query.where(
            InventoryBatch.medicine_id
            == medicine_id
        )

    if status is not None:
        query = query.where(
            InventoryBatch.status == status
        )

    if not include_expired:
        now = datetime.now(timezone.utc)

        query = query.where(
            (InventoryBatch.expiry_date.is_(None))
            | (InventoryBatch.expiry_date > now)
        )

    # FEFO:
    # Earliest expiry comes first.
    # Batches without expiry are placed last.
    query = query.order_by(
        InventoryBatch.expiry_date.is_(None),
        InventoryBatch.expiry_date.asc(),
        InventoryBatch.id.asc(),
    )

    return list(
        db.execute(query)
        .scalars()
        .all()
    )


def get_batches_by_medicine(
    db: Session,
    medicine_id: int,
) -> list[InventoryBatch]:
    return list_inventory_batches(
        db,
        medicine_id=medicine_id,
        include_expired=False,
    )


def list_expiring_batches(
    db: Session,
    days: int = 30,
) -> list[InventoryBatch]:
    if days < 0:
        raise ValueError(
            "Days cannot be negative."
        )

    now = datetime.now(timezone.utc)

    from datetime import timedelta

    expiry_limit = (
        now + timedelta(days=days)
    )

    query = (
        select(InventoryBatch)
        .where(
            InventoryBatch.expiry_date.is_not(None),
            InventoryBatch.expiry_date >= now,
            InventoryBatch.expiry_date <= expiry_limit,
            InventoryBatch.quantity > 0,
        )
        .order_by(
            InventoryBatch.expiry_date.asc()
        )
    )

    return list(
        db.execute(query)
        .scalars()
        .all()
    )


def list_expired_batches(
    db: Session,
) -> list[InventoryBatch]:
    now = datetime.now(timezone.utc)

    batches = list(
        db.execute(
            select(InventoryBatch)
            .where(
                InventoryBatch.expiry_date.is_not(None),
                InventoryBatch.expiry_date < now,
                InventoryBatch.quantity > 0,
            )
            .order_by(
                InventoryBatch.expiry_date.asc()
            )
        )
        .scalars()
        .all()
    )

    for batch in batches:
        batch.status = "expired"

    db.flush()

    return batches


def update_inventory_batch(
    db: Session,
    batch_id: int,
    data: InventoryBatchUpdate,
) -> InventoryBatch:
    batch = db.execute(
        select(InventoryBatch)
        .where(
            InventoryBatch.id == batch_id
        )
        .with_for_update()
    ).scalar_one_or_none()

    if batch is None:
        raise ValueError(
            "Inventory batch not found."
        )

    update_data = data.model_dump(
        exclude_unset=True
    )

    new_quantity = update_data.get(
        "quantity",
        batch.quantity,
    )

    new_reserved_quantity = update_data.get(
        "reserved_quantity",
        batch.reserved_quantity,
    )

    if (
        new_reserved_quantity
        > new_quantity
    ):
        raise ValueError(
            "Reserved quantity cannot exceed "
            "total quantity."
        )

    for field, value in update_data.items():
        setattr(
            batch,
            field,
            value,
        )

    _update_batch_status(batch)

    db.flush()

    _sync_medicine_stock(
        db,
        batch.medicine_id,
    )

    db.flush()

    return batch


def adjust_inventory_batch_quantity(
    db: Session,
    batch_id: int,
    data: InventoryBatchQuantityAdjustment,
) -> InventoryBatch:
    batch = db.execute(
        select(InventoryBatch)
        .where(
            InventoryBatch.id == batch_id
        )
        .with_for_update()
    ).scalar_one_or_none()

    if batch is None:
        raise ValueError(
            "Inventory batch not found."
        )

    new_quantity = (
        batch.quantity
        + data.quantity_change
    )

    if new_quantity < 0:
        raise ValueError(
            "Batch quantity cannot become negative."
        )

    if (
        new_quantity
        < batch.reserved_quantity
    ):
        raise ValueError(
            "Quantity cannot be reduced below "
            "reserved quantity."
        )

    batch.quantity = new_quantity

    _update_batch_status(batch)

    db.flush()

    _sync_medicine_stock(
        db,
        batch.medicine_id,
    )

    db.flush()

    return batch


def reserve_inventory_batch(
    db: Session,
    batch_id: int,
    data: InventoryBatchReservation,
) -> InventoryBatch:
    batch = db.execute(
        select(InventoryBatch)
        .where(
            InventoryBatch.id == batch_id
        )
        .with_for_update()
    ).scalar_one_or_none()

    if batch is None:
        raise ValueError(
            "Inventory batch not found."
        )

    _update_batch_status(batch)

    if batch.status == "expired":
        raise ValueError(
            "Expired stock cannot be reserved."
        )

    available_quantity = (
        batch.quantity
        - batch.reserved_quantity
    )

    if data.quantity > available_quantity:
        raise ValueError(
            f"Only {available_quantity} units "
            "are available for reservation."
        )

    batch.reserved_quantity += (
        data.quantity
    )

    _update_batch_status(batch)

    db.flush()

    return batch


def release_inventory_batch(
    db: Session,
    batch_id: int,
    data: InventoryBatchReservation,
) -> InventoryBatch:
    batch = db.execute(
        select(InventoryBatch)
        .where(
            InventoryBatch.id == batch_id
        )
        .with_for_update()
    ).scalar_one_or_none()

    if batch is None:
        raise ValueError(
            "Inventory batch not found."
        )

    if (
        data.quantity
        > batch.reserved_quantity
    ):
        raise ValueError(
            "Cannot release more stock than "
            "currently reserved."
        )

    batch.reserved_quantity -= (
        data.quantity
    )

    _update_batch_status(batch)

    db.flush()

    return batch


def delete_inventory_batch(
    db: Session,
    batch_id: int,
) -> None:
    batch = db.execute(
        select(InventoryBatch)
        .where(
            InventoryBatch.id == batch_id
        )
        .with_for_update()
    ).scalar_one_or_none()

    if batch is None:
        raise ValueError(
            "Inventory batch not found."
        )

    if batch.quantity > 0:
        raise ValueError(
            "Cannot delete a batch that still "
            "contains stock."
        )

    if batch.reserved_quantity > 0:
        raise ValueError(
            "Cannot delete a batch that has "
            "reserved stock."
        )

    medicine_id = batch.medicine_id

    db.delete(batch)
    db.flush()

    _sync_medicine_stock(
        db,
        medicine_id,
    )

    db.flush()
