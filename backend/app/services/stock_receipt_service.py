from __future__ import annotations

from datetime import datetime, timezone

from decimal import Decimal

from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.models.inventory import Inventory
from app.models.medicine import Medicine
from app.models.purchase_order import PurchaseOrder, PurchaseOrderItem
from app.models.stock_receipt import StockReceipt, StockReceiptItem
from app.models.user import User
from app.schemas.stock_receipt import StockReceiptCreate


VALID_RECEIVING_STATUSES = {
    "approved",
    "ordered",
    "partially_received",
}


def _get_received_quantity(
    db: Session,
    purchase_order_item_id: int,
) -> int:
    result = db.execute(
        select(
            func.coalesce(
                func.sum(
                    StockReceiptItem.received_quantity
                ),
                0,
            )
        ).where(
            StockReceiptItem.purchase_order_item_id
            == purchase_order_item_id
        )
    )

    return int(result.scalar_one())


def _get_total_received_for_purchase_order(
    db: Session,
    purchase_order_id: int,
) -> tuple[int, int]:
    result = db.execute(
        select(
            func.coalesce(
                func.sum(PurchaseOrderItem.quantity),
                0,
            ),
            func.coalesce(
                func.sum(
                    StockReceiptItem.received_quantity
                ),
                0,
            ),
        )
        .outerjoin(
            StockReceiptItem,
            StockReceiptItem.purchase_order_item_id
            == PurchaseOrderItem.id,
        )
        .where(
            PurchaseOrderItem.purchase_order_id
            == purchase_order_id
        )
    )

    ordered, received = result.one()

    return int(ordered), int(received)


def _update_purchase_order_status(
    db: Session,
    purchase_order: PurchaseOrder,
) -> None:
    ordered, received = (
        _get_total_received_for_purchase_order(
            db,
            purchase_order.id,
        )
    )

    if received <= 0:
        return

    if received < ordered:
        purchase_order.status = "partially_received"
    else:
        purchase_order.status = "received"


def _get_or_create_inventory(
    db: Session,
    medicine: Medicine,
    unit_cost: Decimal,
    batch_number: str | None,
    expiry_date,
    location: str | None,
) -> Inventory:
    inventory = db.execute(
        select(Inventory)
        .where(
            Inventory.medicine_id == medicine.id
        )
        .with_for_update()
    ).scalar_one_or_none()

    if inventory is None:
        inventory = Inventory(
            medicine_id=medicine.id,
            quantity=0,
            reserved_quantity=0,
            minimum_stock=10,
            unit_cost=unit_cost,
            location=location,
            batch_number=batch_number,
            expiry_date=expiry_date,
            status="available",
        )

        db.add(inventory)
        db.flush()

    return inventory


def _sync_medicine_stock(
    db: Session,
    medicine_id: int,
) -> None:
    inventory = db.execute(
        select(Inventory)
        .where(
            Inventory.medicine_id == medicine_id
        )
        .with_for_update()
    ).scalar_one_or_none()

    medicine = db.execute(
        select(Medicine)
        .where(
            Medicine.id == medicine_id
        )
        .with_for_update()
    ).scalar_one_or_none()

    if medicine is None:
        raise ValueError(
            f"Medicine {medicine_id} not found."
        )

    if inventory is None:
        medicine.stock_quantity = 0
        return

    medicine.stock_quantity = inventory.quantity


def create_stock_receipt(
    db: Session,
    data: StockReceiptCreate,
) -> StockReceipt:
    existing_receipt = db.execute(
        select(StockReceipt)
        .where(
            StockReceipt.receipt_number
            == data.receipt_number
        )
    ).scalar_one_or_none()

    if existing_receipt is not None:
        raise ValueError(
            "Receipt number already exists."
        )

    purchase_order = db.execute(
        select(PurchaseOrder)
        .where(
            PurchaseOrder.id
            == data.purchase_order_id
        )
        .with_for_update()
    ).scalar_one_or_none()

    if purchase_order is None:
        raise ValueError(
            "Purchase order not found."
        )

    if purchase_order.status not in VALID_RECEIVING_STATUSES:
        raise ValueError(
            "Purchase order cannot receive stock "
            f"while status is '{purchase_order.status}'."
        )

    if data.received_by is not None:
        user = db.execute(
            select(User)
            .where(
                User.id == data.received_by
            )
        ).scalar_one_or_none()

        if user is None:
            raise ValueError(
                "Receiving user not found."
            )

    if not data.items:
        raise ValueError(
            "At least one receipt item is required."
        )

    now = datetime.now(timezone.utc)
    receipt = StockReceipt(
        receipt_number=data.receipt_number,
        purchase_order_id=data.purchase_order_id,
        received_date=data.received_date,
        received_by=data.received_by,
        notes=data.notes,
        created_at=now,
        updated_at=now,
    )

    db.add(receipt)
    db.flush()

    processed_items: set[int] = set()
    affected_medicines: set[int] = set()

    for item_data in data.items:
        po_item_id = item_data.purchase_order_item_id

        if po_item_id in processed_items:
            raise ValueError(
                "The same purchase order item "
                "cannot appear multiple times "
                "in one receipt."
            )

        processed_items.add(po_item_id)

        purchase_order_item = db.execute(
            select(PurchaseOrderItem)
            .where(
                PurchaseOrderItem.id == po_item_id
            )
            .with_for_update()
        ).scalar_one_or_none()

        if purchase_order_item is None:
            raise ValueError(
                f"Purchase order item "
                f"{po_item_id} not found."
            )

        if (
            purchase_order_item.purchase_order_id
            != purchase_order.id
        ):
            raise ValueError(
                f"Purchase order item "
                f"{po_item_id} does not belong to "
                f"purchase order "
                f"{purchase_order.id}."
            )

        already_received = _get_received_quantity(
            db,
            po_item_id,
        )

        remaining_quantity = (
            purchase_order_item.quantity
            - already_received
        )

        if remaining_quantity <= 0:
            raise ValueError(
                f"Purchase order item "
                f"{po_item_id} is already fully received."
            )

        if (
            item_data.received_quantity
            > remaining_quantity
        ):
            raise ValueError(
                f"Cannot receive "
                f"{item_data.received_quantity} units "
                f"for PO item {po_item_id}. "
                f"Remaining quantity is "
                f"{remaining_quantity}."
            )

        medicine = db.execute(
            select(Medicine)
            .where(
                Medicine.id
                == purchase_order_item.medicine_id
            )
            .with_for_update()
        ).scalar_one_or_none()

        if medicine is None:
            raise ValueError(
                f"Medicine "
                f"{purchase_order_item.medicine_id} "
                f"not found."
            )

        receipt_item = StockReceiptItem(
            receipt_id=receipt.id,
            purchase_order_item_id=po_item_id,
            medicine_id=medicine.id,
            received_quantity=(
                item_data.received_quantity
            ),
            unit_cost=item_data.unit_cost,
            batch_number=item_data.batch_number,
            expiry_date=item_data.expiry_date,
            location=item_data.location,
            notes=item_data.notes,
        )

        db.add(receipt_item)

        inventory = _get_or_create_inventory(
            db=db,
            medicine=medicine,
            unit_cost=item_data.unit_cost,
            batch_number=item_data.batch_number,
            expiry_date=item_data.expiry_date,
            location=item_data.location,
        )

        inventory.quantity += (
            item_data.received_quantity
        )

        inventory.unit_cost = item_data.unit_cost

        if item_data.batch_number is not None:
            inventory.batch_number = (
                item_data.batch_number
            )

        if item_data.expiry_date is not None:
            inventory.expiry_date = (
                item_data.expiry_date
            )

        if item_data.location is not None:
            inventory.location = (
                item_data.location
            )

        inventory.status = "available"

        medicine.stock_quantity = inventory.quantity

        affected_medicines.add(medicine.id)

    db.flush()

    _update_purchase_order_status(
        db,
        purchase_order,
    )

    db.flush()

    return db.execute(
        select(StockReceipt)
        .options(
            selectinload(StockReceipt.items)
        )
        .where(
            StockReceipt.id == receipt.id
        )
    ).scalar_one()


def get_stock_receipt_by_id(
    db: Session,
    receipt_id: int,
) -> StockReceipt | None:
    return db.execute(
        select(StockReceipt)
        .options(
            selectinload(StockReceipt.items)
        )
        .where(
            StockReceipt.id == receipt_id
        )
    ).scalar_one_or_none()


def get_stock_receipt_by_number(
    db: Session,
    receipt_number: str,
) -> StockReceipt | None:
    return db.execute(
        select(StockReceipt)
        .options(
            selectinload(StockReceipt.items)
        )
        .where(
            StockReceipt.receipt_number
            == receipt_number
        )
    ).scalar_one_or_none()


def list_stock_receipts(
    db: Session,
    purchase_order_id: int | None = None,
) -> list[StockReceipt]:
    query = (
        select(StockReceipt)
        .options(
            selectinload(StockReceipt.items)
        )
        .order_by(
            StockReceipt.received_date.desc(),
            StockReceipt.id.desc(),
        )
    )

    if purchase_order_id is not None:
        query = query.where(
            StockReceipt.purchase_order_id
            == purchase_order_id
        )

    return list(
        db.execute(query)
        .scalars()
        .unique()
        .all()
    )


def delete_stock_receipt(
    db: Session,
    receipt_id: int,
) -> None:
    receipt = db.execute(
        select(StockReceipt)
        .options(
            selectinload(StockReceipt.items)
        )
        .where(
            StockReceipt.id == receipt_id
        )
        .with_for_update()
    ).scalar_one_or_none()

    if receipt is None:
        raise ValueError(
            "Stock receipt not found."
        )

    purchase_order = db.execute(
        select(PurchaseOrder)
        .where(
            PurchaseOrder.id
            == receipt.purchase_order_id
        )
        .with_for_update()
    ).scalar_one()

    affected_medicines = {
        item.medicine_id
        for item in receipt.items
    }

    for item in receipt.items:
        inventory = db.execute(
            select(Inventory)
            .where(
                Inventory.medicine_id
                == item.medicine_id
            )
            .with_for_update()
        ).scalar_one_or_none()

        if inventory is None:
            raise ValueError(
                f"Inventory record not found for "
                f"medicine {item.medicine_id}."
            )

        if (
            inventory.quantity
            < item.received_quantity
        ):
            raise ValueError(
                f"Cannot reverse receipt for medicine "
                f"{item.medicine_id}: current inventory "
                f"is lower than the quantity being reversed."
            )

        if (
            inventory.quantity
            - item.received_quantity
            < inventory.reserved_quantity
        ):
            raise ValueError(
                f"Cannot reverse receipt for medicine "
                f"{item.medicine_id}: reserved stock "
                f"would exceed available stock."
            )

        inventory.quantity -= (
            item.received_quantity
        )

        if inventory.quantity == 0:
            inventory.status = "out_of_stock"

    db.delete(receipt)
    db.flush()

    for medicine_id in affected_medicines:
        _sync_medicine_stock(
            db,
            medicine_id,
        )

    _update_purchase_order_status(
        db,
        purchase_order,
    )

    db.flush()
