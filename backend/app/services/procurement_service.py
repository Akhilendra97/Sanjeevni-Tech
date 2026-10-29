from __future__ import annotations

from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.models.medicine import Medicine
from app.models.purchase_order import PurchaseOrder, PurchaseOrderItem
from app.models.supplier import Supplier
from app.schemas.procurement import (
    PurchaseOrderCreate,
    PurchaseOrderItemUpdate,
    PurchaseOrderUpdate,
)


# ============================================================
# SUPPLIER OPERATIONS
# ============================================================

def create_supplier(
    db: Session,
    *,
    supplier_code: str,
    name: str,
    contact_person: str | None = None,
    phone: str | None = None,
    email: str | None = None,
    address: str | None = None,
    city: str | None = None,
    state: str | None = None,
    postal_code: str | None = None,
    gst_number: str | None = None,
    payment_terms: str | None = None,
    notes: str | None = None,
) -> Supplier:
    existing = db.scalar(
        select(Supplier).where(
            Supplier.supplier_code == supplier_code
        )
    )

    if existing is not None:
        raise ValueError(
            f"Supplier code '{supplier_code}' already exists."
        )

    if gst_number:
        existing_gst = db.scalar(
            select(Supplier).where(
                Supplier.gst_number == gst_number
            )
        )

        if existing_gst is not None:
            raise ValueError(
                f"GST number '{gst_number}' already exists."
            )

    supplier = Supplier(
        supplier_code=supplier_code,
        name=name,
        contact_person=contact_person,
        phone=phone,
        email=email,
        address=address,
        city=city,
        state=state,
        postal_code=postal_code,
        gst_number=gst_number,
        payment_terms=payment_terms,
        notes=notes,
        is_active=True,
    )

    db.add(supplier)
    db.commit()
    db.refresh(supplier)

    return supplier


def get_supplier_by_id(
    db: Session,
    supplier_id: int,
) -> Supplier | None:
    return db.scalar(
        select(Supplier).where(
            Supplier.id == supplier_id
        )
    )


def get_supplier_by_code(
    db: Session,
    supplier_code: str,
) -> Supplier | None:
    return db.scalar(
        select(Supplier).where(
            Supplier.supplier_code == supplier_code
        )
    )


def list_suppliers(
    db: Session,
    *,
    active_only: bool = False,
) -> list[Supplier]:
    statement = select(Supplier).order_by(
        Supplier.name.asc()
    )

    if active_only:
        statement = statement.where(
            Supplier.is_active.is_(True)
        )

    return list(db.scalars(statement).all())


def update_supplier(
    db: Session,
    *,
    supplier: Supplier,
    **updates,
) -> Supplier:
    if "supplier_code" in updates:
        supplier_code = updates["supplier_code"]

        if supplier_code != supplier.supplier_code:
            existing = db.scalar(
                select(Supplier).where(
                    Supplier.supplier_code == supplier_code,
                    Supplier.id != supplier.id,
                )
            )

            if existing is not None:
                raise ValueError(
                    f"Supplier code '{supplier_code}' already exists."
                )

    if "gst_number" in updates:
        gst_number = updates["gst_number"]

        if gst_number:
            existing = db.scalar(
                select(Supplier).where(
                    Supplier.gst_number == gst_number,
                    Supplier.id != supplier.id,
                )
            )

            if existing is not None:
                raise ValueError(
                    f"GST number '{gst_number}' already exists."
                )

    for field, value in updates.items():
        if hasattr(supplier, field):
            setattr(supplier, field, value)

    db.commit()
    db.refresh(supplier)

    return supplier


def deactivate_supplier(
    db: Session,
    *,
    supplier: Supplier,
) -> Supplier:
    supplier.is_active = False

    db.commit()
    db.refresh(supplier)

    return supplier


# ============================================================
# PURCHASE ORDER HELPERS
# ============================================================

def _calculate_item_total(
    *,
    quantity: int,
    unit_price: Decimal,
    tax_percent: Decimal,
    discount_amount: Decimal,
) -> Decimal:
    base_amount = (
        Decimal(quantity) * unit_price
    )

    tax_amount = (
        base_amount * tax_percent / Decimal("100")
    )

    total = (
        base_amount
        + tax_amount
        - discount_amount
    )

    if total < Decimal("0"):
        total = Decimal("0")

    return total.quantize(Decimal("0.01"))


def _calculate_order_totals(
    items: list[PurchaseOrderItem],
    tax_amount: Decimal,
    discount_amount: Decimal,
) -> tuple[Decimal, Decimal]:
    subtotal = sum(
        (
            Decimal(item.quantity) * item.unit_price
            for item in items
        ),
        Decimal("0"),
    )

    # Each line's total_amount already includes its line-level tax and discount.
    # Add order-level tax/discount only once; do not silently drop line tax.
    line_totals = sum(
        (Decimal(item.total_amount or 0) for item in items),
        Decimal("0"),
    )
    total_amount = (
        line_totals
        + tax_amount
        - discount_amount
    )

    if total_amount < Decimal("0"):
        total_amount = Decimal("0")

    return (
        subtotal.quantize(Decimal("0.01")),
        total_amount.quantize(Decimal("0.01")),
    )


# ============================================================
# PURCHASE ORDER CREATE
# ============================================================

def create_purchase_order(
    db: Session,
    *,
    data: PurchaseOrderCreate,
) -> PurchaseOrder:
    existing = db.scalar(
        select(PurchaseOrder).where(
            PurchaseOrder.purchase_order_number
            == data.purchase_order_number
        )
    )

    if existing is not None:
        raise ValueError(
            f"Purchase order "
            f"'{data.purchase_order_number}' already exists."
        )

    supplier = db.scalar(
        select(Supplier).where(
            Supplier.id == data.supplier_id
        )
    )

    if supplier is None:
        raise ValueError(
            "Supplier not found."
        )

    if not supplier.is_active:
        raise ValueError(
            "Cannot create purchase order for an inactive supplier."
        )

    medicine_ids = {
        item.medicine_id
        for item in data.items
    }

    medicines = db.scalars(
        select(Medicine).where(
            Medicine.id.in_(medicine_ids)
        )
    ).all()

    medicine_map = {
        medicine.id: medicine
        for medicine in medicines
    }

    missing_medicines = (
        medicine_ids - medicine_map.keys()
    )

    if missing_medicines:
        raise ValueError(
            "Medicine not found: "
            + ", ".join(
                str(medicine_id)
                for medicine_id in sorted(missing_medicines)
            )
        )

    purchase_order = PurchaseOrder(
        purchase_order_number=data.purchase_order_number,
        supplier_id=data.supplier_id,
        order_date=data.order_date,
        expected_delivery_date=data.expected_delivery_date,
        status=data.status,
        tax_amount=data.tax_amount,
        discount_amount=data.discount_amount,
        notes=data.notes,
    )

    db.add(purchase_order)
    db.flush()

    for item_data in data.items:
        medicine = medicine_map[item_data.medicine_id]

        if not medicine.is_active:
            raise ValueError(
                f"Medicine '{medicine.name}' is inactive."
            )

        item_total = _calculate_item_total(
            quantity=item_data.quantity,
            unit_price=item_data.unit_price,
            tax_percent=item_data.tax_percent,
            discount_amount=item_data.discount_amount,
        )

        item = PurchaseOrderItem(
            purchase_order_id=purchase_order.id,
            medicine_id=item_data.medicine_id,
            quantity=item_data.quantity,
            unit_price=item_data.unit_price,
            tax_percent=item_data.tax_percent,
            discount_amount=item_data.discount_amount,
            total_amount=item_total,
            notes=item_data.notes,
        )

        db.add(item)

    db.flush()

    subtotal, total_amount = _calculate_order_totals(
        purchase_order.items,
        purchase_order.tax_amount,
        purchase_order.discount_amount,
    )

    purchase_order.subtotal = subtotal
    purchase_order.total_amount = total_amount

    db.commit()

    return get_purchase_order_by_id(
        db,
        purchase_order.id,
    )


# ============================================================
# PURCHASE ORDER READ
# ============================================================

def get_purchase_order_by_id(
    db: Session,
    purchase_order_id: int,
) -> PurchaseOrder | None:
    statement = (
        select(PurchaseOrder)
        .options(
            selectinload(PurchaseOrder.items),
            selectinload(PurchaseOrder.supplier),
        )
        .where(
            PurchaseOrder.id == purchase_order_id
        )
    )

    return db.scalar(statement)


def get_purchase_order_by_number(
    db: Session,
    purchase_order_number: str,
) -> PurchaseOrder | None:
    statement = (
        select(PurchaseOrder)
        .options(
            selectinload(PurchaseOrder.items),
            selectinload(PurchaseOrder.supplier),
        )
        .where(
            PurchaseOrder.purchase_order_number
            == purchase_order_number
        )
    )

    return db.scalar(statement)


def list_purchase_orders(
    db: Session,
    *,
    status: str | None = None,
) -> list[PurchaseOrder]:
    statement = (
        select(PurchaseOrder)
        .options(
            selectinload(PurchaseOrder.items),
            selectinload(PurchaseOrder.supplier),
        )
        .order_by(
            PurchaseOrder.created_at.desc()
        )
    )

    if status is not None:
        statement = statement.where(
            PurchaseOrder.status == status
        )

    return list(db.scalars(statement).unique().all())


# ============================================================
# PURCHASE ORDER UPDATE
# ============================================================

def update_purchase_order(
    db: Session,
    *,
    purchase_order: PurchaseOrder,
    data: PurchaseOrderUpdate,
) -> PurchaseOrder:
    update_data = data.model_dump(
        exclude_unset=True
    )

    for field, value in update_data.items():
        setattr(
            purchase_order,
            field,
            value,
        )

    db.commit()

    return get_purchase_order_by_id(
        db,
        purchase_order.id,
    )


# ============================================================
# PURCHASE ORDER ITEM UPDATE
# ============================================================

def get_purchase_order_item_by_id(
    db: Session,
    item_id: int,
) -> PurchaseOrderItem | None:
    return db.scalar(
        select(PurchaseOrderItem).where(
            PurchaseOrderItem.id == item_id
        )
    )


def update_purchase_order_item(
    db: Session,
    *,
    item: PurchaseOrderItem,
    data: PurchaseOrderItemUpdate,
) -> PurchaseOrderItem:
    update_data = data.model_dump(
        exclude_unset=True
    )

    for field, value in update_data.items():
        setattr(
            item,
            field,
            value,
        )

    item.total_amount = _calculate_item_total(
        quantity=item.quantity,
        unit_price=item.unit_price,
        tax_percent=item.tax_percent,
        discount_amount=item.discount_amount,
    )

    db.flush()

    purchase_order = item.purchase_order

    subtotal, total_amount = _calculate_order_totals(
        purchase_order.items,
        purchase_order.tax_amount,
        purchase_order.discount_amount,
    )

    purchase_order.subtotal = subtotal
    purchase_order.total_amount = total_amount

    db.commit()
    db.refresh(item)

    return item


# ============================================================
# PURCHASE ORDER DELETE
# ============================================================

def delete_purchase_order(
    db: Session,
    *,
    purchase_order: PurchaseOrder,
) -> None:
    db.delete(purchase_order)
    db.commit()


def delete_purchase_order_item(
    db: Session,
    *,
    item: PurchaseOrderItem,
) -> None:
    purchase_order = item.purchase_order

    db.delete(item)
    db.flush()

    subtotal, total_amount = _calculate_order_totals(
        [
            current_item
            for current_item in purchase_order.items
            if current_item.id != item.id
        ],
        purchase_order.tax_amount,
        purchase_order.discount_amount,
    )

    purchase_order.subtotal = subtotal
    purchase_order.total_amount = total_amount

    db.commit()


# ============================================================
# PURCHASE ORDER STATUS
# ============================================================

VALID_PURCHASE_ORDER_STATUSES = {
    "draft",
    "pending",
    "approved",
    "ordered",
    "partially_received",
    "received",
    "cancelled",
    "closed",
}


def update_purchase_order_status(
    db: Session,
    *,
    purchase_order: PurchaseOrder,
    status: str,
) -> PurchaseOrder:
    normalized_status = status.strip().lower()

    if normalized_status not in VALID_PURCHASE_ORDER_STATUSES:
        raise ValueError(
            "Invalid purchase order status. "
            f"Allowed values: "
            f"{', '.join(sorted(VALID_PURCHASE_ORDER_STATUSES))}"
        )

    purchase_order.status = normalized_status

    db.commit()
    db.refresh(purchase_order)

    return purchase_order
