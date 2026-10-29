from __future__ import annotations

from datetime import datetime, timezone
from decimal import Decimal

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.inventory import Inventory
from app.models.inventory_batch import InventoryBatch
from app.models.medicine import Medicine
from app.models.patient import Patient
from app.models.pharmacy_dispensing import (
    PharmacyDispensing,
    PharmacyDispensingItem,
)
from app.models.prescription import Prescription
from app.models.user import User


VALID_STATUSES = {
    "pending",
    "partially_dispensed",
    "dispensed",
    "cancelled",
}


def _update_batch_status(batch: InventoryBatch) -> None:
    now = datetime.now(timezone.utc)

    if batch.quantity <= 0:
        batch.status = "out_of_stock"
    elif (
        batch.expiry_date is not None
        and batch.expiry_date <= now
    ):
        batch.status = "expired"
    elif batch.reserved_quantity > 0:
        batch.status = "reserved"
    else:
        batch.status = "available"


def _sync_medicine_stock(
    db: Session,
    medicine_id: int,
) -> None:
    total_quantity = (
        db.query(
            func.coalesce(
                func.sum(InventoryBatch.quantity),
                0,
            )
        )
        .filter(
            InventoryBatch.medicine_id == medicine_id,
        )
        .scalar()
    )

    medicine = (
        db.query(Medicine)
        .filter(Medicine.id == medicine_id)
        .with_for_update()
        .first()
    )

    if medicine is not None:
        medicine.stock_quantity = int(
            total_quantity or 0
        )


def _sync_inventory_stock(
    db: Session,
    medicine_id: int,
) -> Inventory:
    inventory = (
        db.query(Inventory)
        .filter(
            Inventory.medicine_id == medicine_id,
        )
        .with_for_update()
        .first()
    )

    if inventory is None:
        inventory = Inventory(
            medicine_id=medicine_id,
            quantity=0,
            reserved_quantity=0,
            minimum_stock=10,
            status="available",
        )
        db.add(inventory)
        db.flush()
    else:
        total_quantity = (
            db.query(
                func.coalesce(
                    func.sum(InventoryBatch.quantity),
                    0,
                )
            )
            .filter(
                InventoryBatch.medicine_id == medicine_id,
            )
            .scalar()
        )

        total_reserved = (
            db.query(
                func.coalesce(
                    func.sum(
                        InventoryBatch.reserved_quantity
                    ),
                    0,
                )
            )
            .filter(
                InventoryBatch.medicine_id == medicine_id,
            )
            .scalar()
        )

        inventory.quantity = int(
            total_quantity or 0
        )
        inventory.reserved_quantity = int(
            total_reserved or 0
        )

        available_quantity = (
            inventory.quantity
            - inventory.reserved_quantity
        )

        if inventory.quantity <= 0:
            inventory.status = "out_of_stock"
        elif available_quantity <= 0:
            inventory.status = "reserved"
        elif (
            inventory.minimum_stock is not None
            and available_quantity
            <= inventory.minimum_stock
        ):
            inventory.status = "low_stock"
        else:
            inventory.status = "available"

    return inventory


def _get_fefo_batches(
    db: Session,
    medicine_id: int,
) -> list[InventoryBatch]:
    now = datetime.now(timezone.utc)

    batches = (
        db.query(InventoryBatch)
        .filter(
            InventoryBatch.medicine_id
            == medicine_id,
            InventoryBatch.quantity > 0,
            InventoryBatch.quantity
            > InventoryBatch.reserved_quantity,
            (
                InventoryBatch.expiry_date.is_(None)
                | (
                    InventoryBatch.expiry_date
                    > now
                )
            ),
        )
        .order_by(
            InventoryBatch.expiry_date.asc().nullslast(),
            InventoryBatch.id.asc(),
        )
        .with_for_update()
        .all()
    )

    return batches


def _allocate_quantity_fefo(
    db: Session,
    *,
    medicine_id: int,
    requested_quantity: int,
) -> list[tuple[InventoryBatch, int]]:
    if requested_quantity <= 0:
        raise ValueError(
            "Requested quantity must be greater than zero."
        )

    batches = _get_fefo_batches(
        db,
        medicine_id,
    )

    remaining = requested_quantity
    allocations: list[
        tuple[InventoryBatch, int]
    ] = []

    for batch in batches:
        available_quantity = (
            batch.quantity
            - batch.reserved_quantity
        )

        if available_quantity <= 0:
            continue

        allocated_quantity = min(
            available_quantity,
            remaining,
        )

        if allocated_quantity > 0:
            allocations.append(
                (
                    batch,
                    allocated_quantity,
                )
            )

            remaining -= allocated_quantity

        if remaining == 0:
            break

    if remaining > 0:
        raise ValueError(
            f"Insufficient available stock for "
            f"medicine ID {medicine_id}. "
            f"Short by {remaining}."
        )

    return allocations


def _get_total_dispensed_for_prescription(
    db: Session,
    prescription_id: int,
) -> dict[int, int]:
    rows = (
        db.query(
            PharmacyDispensingItem.medicine_id,
            func.coalesce(
                func.sum(
                    PharmacyDispensingItem.dispensed_quantity
                ),
                0,
            ),
        )
        .join(
            PharmacyDispensing,
            PharmacyDispensing.id
            == PharmacyDispensingItem.dispensing_id,
        )
        .filter(
            PharmacyDispensing.prescription_id
            == prescription_id,
            PharmacyDispensing.status != "cancelled",
        )
        .group_by(
            PharmacyDispensingItem.medicine_id,
        )
        .all()
    )

    return {
        medicine_id: int(quantity or 0)
        for medicine_id, quantity in rows
    }


def create_pharmacy_dispensing(
    db: Session,
    *,
    dispensing_number: str,
    prescription_id: int,
    patient_id: int,
    pharmacist_id: int | None,
    items,
    notes: str | None = None,
) -> PharmacyDispensing:

    existing = (
        db.query(PharmacyDispensing)
        .filter(
            PharmacyDispensing.dispensing_number
            == dispensing_number,
        )
        .first()
    )

    if existing:
        raise ValueError(
            "Dispensing number already exists."
        )

    prescription = (
        db.query(Prescription)
        .filter(
            Prescription.id == prescription_id,
        )
        .with_for_update()
        .first()
    )

    if prescription is None:
        raise ValueError(
            "Prescription not found."
        )

    patient = (
        db.query(Patient)
        .filter(Patient.id == patient_id)
        .first()
    )

    if patient is None:
        raise ValueError(
            "Patient not found."
        )

    if prescription.patient_id != patient_id:
        raise ValueError(
            "Prescription does not belong to the selected patient."
        )

    if pharmacist_id is not None:
        pharmacist = (
            db.query(User)
            .filter(User.id == pharmacist_id)
            .first()
        )

        if pharmacist is None:
            raise ValueError(
                "Pharmacist user not found."
            )

    if not items:
        raise ValueError(
            "At least one medicine item is required."
        )

    previous_dispensed = (
        _get_total_dispensed_for_prescription(
            db,
            prescription_id,
        )
    )

    dispensing = PharmacyDispensing(
        dispensing_number=dispensing_number,
        prescription_id=prescription_id,
        patient_id=patient_id,
        pharmacist_id=pharmacist_id,
        status="pending",
        total_amount=Decimal("0.00"),
        notes=notes,
    )

    db.add(dispensing)
    db.flush()

    total_amount = Decimal("0.00")
    fully_dispensed = True

    for item in items:
        if item.dispensed_quantity <= 0:
            raise ValueError(
                "Dispensed quantity must be greater than zero."
            )

        if (
            item.dispensed_quantity
            > item.prescribed_quantity
        ):
            raise ValueError(
                "Dispensed quantity cannot exceed prescribed quantity."
            )

        medicine = (
            db.query(Medicine)
            .filter(
                Medicine.id == item.medicine_id,
            )
            .with_for_update()
            .first()
        )

        if medicine is None:
            raise ValueError(
                f"Medicine ID {item.medicine_id} not found."
            )

        if not medicine.is_active:
            raise ValueError(
                f"Medicine '{medicine.name}' is inactive."
            )

        already_dispensed = previous_dispensed.get(
            item.medicine_id,
            0,
        )

        remaining_prescribed = (
            item.prescribed_quantity
            - already_dispensed
        )

        if item.dispensed_quantity > remaining_prescribed:
            raise ValueError(
                f"Medicine '{medicine.name}' exceeds "
                f"remaining prescribed quantity."
            )

        allocations = _allocate_quantity_fefo(
            db,
            medicine_id=item.medicine_id,
            requested_quantity=item.dispensed_quantity,
        )

        remaining_for_item = item.dispensed_quantity

        for batch, allocated_quantity in allocations:
            batch.quantity -= allocated_quantity

            _update_batch_status(batch)

            item_total = (
                Decimal(str(item.unit_price))
                * Decimal(allocated_quantity)
            )

            dispensing_item = PharmacyDispensingItem(
                dispensing_id=dispensing.id,
                medicine_id=item.medicine_id,
                inventory_batch_id=batch.id,
                prescribed_quantity=item.prescribed_quantity,
                dispensed_quantity=allocated_quantity,
                unit_price=item.unit_price,
                total_amount=item_total,
                notes=item.notes,
            )

            db.add(dispensing_item)

            total_amount += item_total
            remaining_for_item -= allocated_quantity

        if remaining_for_item != 0:
            raise ValueError(
                "Unable to allocate complete dispensing quantity."
            )

        if (
            already_dispensed
            + item.dispensed_quantity
            < item.prescribed_quantity
        ):
            fully_dispensed = False

        _sync_medicine_stock(
            db,
            item.medicine_id,
        )

        _sync_inventory_stock(
            db,
            item.medicine_id,
        )

    dispensing.total_amount = total_amount

    if fully_dispensed:
        dispensing.status = "dispensed"
        dispensing.dispensed_at = datetime.now(
            timezone.utc
        )
    else:
        dispensing.status = "partially_dispensed"

    db.commit()
    db.refresh(dispensing)

    return dispensing


def get_pharmacy_dispensing_by_id(
    db: Session,
    dispensing_id: int,
) -> PharmacyDispensing | None:

    return (
        db.query(PharmacyDispensing)
        .filter(
            PharmacyDispensing.id
            == dispensing_id,
        )
        .first()
    )


def get_pharmacy_dispensing_by_number(
    db: Session,
    dispensing_number: str,
) -> PharmacyDispensing | None:

    return (
        db.query(PharmacyDispensing)
        .filter(
            PharmacyDispensing.dispensing_number
            == dispensing_number,
        )
        .first()
    )


def list_pharmacy_dispensings(
    db: Session,
    *,
    patient_id: int | None = None,
    prescription_id: int | None = None,
    status: str | None = None,
) -> list[PharmacyDispensing]:

    query = db.query(PharmacyDispensing)

    if patient_id is not None:
        query = query.filter(
            PharmacyDispensing.patient_id
            == patient_id,
        )

    if prescription_id is not None:
        query = query.filter(
            PharmacyDispensing.prescription_id
            == prescription_id,
        )

    if status is not None:
        if status not in VALID_STATUSES:
            raise ValueError(
                "Invalid dispensing status."
            )

        query = query.filter(
            PharmacyDispensing.status
            == status,
        )

    return (
        query
        .order_by(
            PharmacyDispensing.id.desc()
        )
        .all()
    )


def cancel_pharmacy_dispensing(
    db: Session,
    dispensing: PharmacyDispensing,
) -> PharmacyDispensing:

    if dispensing.status == "cancelled":
        raise ValueError(
            "Dispensing is already cancelled."
        )

    if dispensing.status == "pending":
        dispensing.status = "cancelled"
        db.commit()
        db.refresh(dispensing)
        return dispensing

    items = (
        db.query(PharmacyDispensingItem)
        .filter(
            PharmacyDispensingItem.dispensing_id
            == dispensing.id,
        )
        .with_for_update()
        .all()
    )

    affected_medicines: set[int] = set()

    for item in items:
        batch = (
            db.query(InventoryBatch)
            .filter(
                InventoryBatch.id
                == item.inventory_batch_id,
            )
            .with_for_update()
            .first()
        )

        if batch is None:
            raise ValueError(
                f"Inventory batch ID "
                f"{item.inventory_batch_id} not found."
            )

        batch.quantity += item.dispensed_quantity

        _update_batch_status(batch)

        affected_medicines.add(
            item.medicine_id
        )

    for medicine_id in affected_medicines:
        _sync_medicine_stock(
            db,
            medicine_id,
        )

        _sync_inventory_stock(
            db,
            medicine_id,
        )

    dispensing.status = "cancelled"

    db.commit()
    db.refresh(dispensing)

    return dispensing


def delete_pharmacy_dispensing(
    db: Session,
    dispensing: PharmacyDispensing,
) -> None:

    if dispensing.status != "cancelled":
        raise ValueError(
            "Only cancelled dispensing records can be deleted."
        )

    db.delete(dispensing)
    db.commit()
