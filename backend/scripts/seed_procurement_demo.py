"""
Idempotent demo seeder for the Sanjeevni Tech Procurement workflow.

Creates clearly marked DEMO supplier + approved purchase order only when
matching demo identifiers do not already exist. It uses existing active
Medicine records and does not create medicines, stock receipts, inventory,
or modify existing real records.
Run from backend: .\.venv\Scripts\python.exe -m scripts.seed_procurement_demo
"""
from datetime import date, timedelta
from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.core.database import SessionLocal
from app.models.medicine import Medicine
from app.models.purchase_order import PurchaseOrder, PurchaseOrderItem
from app.models.supplier import Supplier

DEMO_SUPPLIER_CODE = "DEMO-PROC-SUP-001"
DEMO_PO_NUMBER = "DEMO-PROC-PO-001"
DEMO_NOTE = (
    "DEMO DATA ONLY — created for procurement workflow testing; "
    "not a real supplier order or purchase commitment."
)


def main() -> None:
    db = SessionLocal()
    try:
        supplier = db.scalar(
            select(Supplier).where(Supplier.supplier_code == DEMO_SUPPLIER_CODE)
        )
        if supplier is None:
            supplier = Supplier(
                supplier_code=DEMO_SUPPLIER_CODE,
                name="DEMO Hospital Supplies",
                contact_person="Demo Procurement Contact",
                phone=None,
                email=None,
                address="Demo record — not a real address",
                city="Kanpur",
                state="Uttar Pradesh",
                postal_code=None,
                gst_number=None,
                payment_terms="Demo only",
                notes=DEMO_NOTE,
                is_active=True,
            )
            db.add(supplier)
            db.flush()
            print(f"Created demo supplier: {DEMO_SUPPLIER_CODE}")
        else:
            print(f"Demo supplier already exists: {DEMO_SUPPLIER_CODE}")

        order = db.scalar(
            select(PurchaseOrder)
            .options(selectinload(PurchaseOrder.items))
            .where(PurchaseOrder.purchase_order_number == DEMO_PO_NUMBER)
        )
        if order is not None:
            print(
                f"Demo purchase order already exists: {DEMO_PO_NUMBER} "
                f"(status={order.status}); it was not overwritten."
            )
            db.commit()
            return

        medicines = list(
            db.scalars(
                select(Medicine)
                .where(Medicine.is_active.is_(True))
                .order_by(Medicine.id.asc())
                .limit(2)
            ).all()
        )
        if not medicines:
            db.rollback()
            print(
                "NO PROCUREMENT ORDER CREATED: no active medicine records exist. "
                "Add/activate a legitimate medicine through the existing Medicines "
                "module, then run this script again. No medicine or stock was fabricated."
            )
            return

        today = date.today()
        order = PurchaseOrder(
            purchase_order_number=DEMO_PO_NUMBER,
            supplier_id=supplier.id,
            order_date=today,
            expected_delivery_date=today + timedelta(days=7),
            status="approved",
            subtotal=Decimal("0.00"),
            tax_amount=Decimal("0.00"),
            discount_amount=Decimal("0.00"),
            total_amount=Decimal("0.00"),
            notes=DEMO_NOTE,
        )
        db.add(order)
        db.flush()

        subtotal = Decimal("0.00")
        for medicine in medicines:
            price = Decimal(str(medicine.purchase_price or 0)).quantize(Decimal("0.01"))
            if price <= 0:
                # Explicit demo-only nominal cost; this is on the demo PO only and
                # does not overwrite the medicine's purchase_price or stock.
                price = Decimal("1.00")
            quantity = 10
            line_total = (price * quantity).quantize(Decimal("0.01"))
            item = PurchaseOrderItem(
                purchase_order_id=order.id,
                medicine_id=medicine.id,
                quantity=quantity,
                unit_price=price,
                tax_percent=Decimal("0.00"),
                discount_amount=Decimal("0.00"),
                total_amount=line_total,
                notes="DEMO workflow line; verify before any real procurement.",
            )
            db.add(item)
            subtotal += line_total

        order.subtotal = subtotal
        order.total_amount = subtotal
        db.commit()
        print(f"Created approved demo purchase order: {DEMO_PO_NUMBER}")
        print(f"Supplier: {supplier.name}")
        print(f"Items: {len(medicines)} existing active medicine(s), 10 units each")
        print(f"Total: INR {subtotal:.2f}")
        print("This order is explicitly marked DEMO DATA ONLY.")
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
