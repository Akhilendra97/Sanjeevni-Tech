from datetime import date, datetime

from sqlalchemy import Date, DateTime, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class StockReceipt(Base):
    __tablename__ = "stock_receipts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)

    receipt_number: Mapped[str] = mapped_column(
        String(50),
        unique=True,
        index=True,
        nullable=False,
    )

    purchase_order_id: Mapped[int] = mapped_column(
        ForeignKey("purchase_orders.id", ondelete="RESTRICT"),
        index=True,
        nullable=False,
    )

    received_date: Mapped[date] = mapped_column(
        Date,
        default=date.today,
        nullable=False,
    )

    received_by: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    notes: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
    )

    purchase_order = relationship(
        "PurchaseOrder",
        back_populates="stock_receipts",
    )

    received_by_user = relationship(
        "User",
        foreign_keys=[received_by],
    )

    items = relationship(
        "StockReceiptItem",
        back_populates="receipt",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )


class StockReceiptItem(Base):
    __tablename__ = "stock_receipt_items"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
    )

    receipt_id: Mapped[int] = mapped_column(
        ForeignKey("stock_receipts.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )

    purchase_order_item_id: Mapped[int] = mapped_column(
        ForeignKey("purchase_order_items.id", ondelete="RESTRICT"),
        index=True,
        nullable=False,
    )

    medicine_id: Mapped[int] = mapped_column(
        ForeignKey("medicines.id", ondelete="RESTRICT"),
        index=True,
        nullable=False,
    )

    received_quantity: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    unit_cost: Mapped[float] = mapped_column(
        Numeric(12, 2),
        nullable=False,
    )

    batch_number: Mapped[str | None] = mapped_column(
        String(100),
        index=True,
        nullable=True,
    )

    expiry_date: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        index=True,
        nullable=True,
    )

    location: Mapped[str | None] = mapped_column(
        String(150),
        index=True,
        nullable=True,
    )

    notes: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    receipt = relationship(
        "StockReceipt",
        back_populates="items",
    )

    purchase_order_item = relationship(
        "PurchaseOrderItem",
    )

    medicine = relationship(
        "Medicine",
    )
