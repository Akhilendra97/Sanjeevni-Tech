"""
Idempotent demo receipt seeder for Stock Receiving.
Creates one clearly labelled demo goods-received note against DEMO-PROC-PO-001.
It uses the existing purchase order items, receives at most one unit per item,
and updates inventory only through the existing stock-receipt service.
"""
from datetime import date, datetime, timedelta, timezone
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.core.database import SessionLocal
from app.models.purchase_order import PurchaseOrder
from app.models.stock_receipt import StockReceipt
from app.schemas.stock_receipt import StockReceiptCreate, StockReceiptItemCreate
from app.services.stock_receipt_service import create_stock_receipt

PO_NUMBER = "DEMO-PROC-PO-001"
RECEIPT_NUMBER = "DEMO-GRN-001"
DEMO_NOTE = "DEMO DATA ONLY — sample receipt for testing the Stock Receiving workflow."


def main():
    db = SessionLocal()
    try:
        existing = db.scalar(
            select(StockReceipt).where(
                StockReceipt.receipt_number == RECEIPT_NUMBER
            )
        )
        if existing:
            print(f"Demo receipt already exists: {RECEIPT_NUMBER}; no duplicate created.")
            return

        order = db.scalar(
            select(PurchaseOrder)
            .options(selectinload(PurchaseOrder.items))
            .where(PurchaseOrder.purchase_order_number == PO_NUMBER)
        )
        if order is None:
            raise RuntimeError(
                f"{PO_NUMBER} not found. Run scripts.seed_procurement_demo first."
            )

        if order.status not in {"approved", "ordered", "partially_received"}:
            raise RuntimeError(
                f"Demo order status is '{order.status}', not eligible for receiving. "
                "No receipt or stock changes were made."
            )

        items = []
        for po_item in order.items:
            if not po_item.medicine_id:
                continue
            items.append(
                StockReceiptItemCreate(
                    purchase_order_item_id=po_item.id,
                    received_quantity=1,
                    unit_cost=po_item.unit_price,
                    batch_number=f"DEMO-BATCH-{po_item.id}",
                    expiry_date=datetime.combine(
                        date.today() + timedelta(days=365),
                        datetime.min.time(),
                        tzinfo=timezone.utc,
                    ),
                    location="DEMO-STORAGE",
                    notes="Demo receipt line; not a real delivery.",
                )
            )

        if not items:
            raise RuntimeError("Demo purchase order has no usable items; no stock was changed.")

        receipt = create_stock_receipt(
            db,
            StockReceiptCreate(
                receipt_number=RECEIPT_NUMBER,
                purchase_order_id=order.id,
                received_date=date.today(),
                notes=DEMO_NOTE,
                items=items,
            ),
        )
        db.commit()
        print(f"Created demo stock receipt: {receipt.receipt_number}")
        print(f"Purchase order: {PO_NUMBER}")
        print(f"Receipt lines: {len(items)} (1 unit per line)")
        print("Inventory quantities were incremented through the existing receipt service.")
        print("DEMO DATA ONLY — verify and remove demo records using application controls if appropriate.")
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
