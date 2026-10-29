"""add stock receiving module

Revision ID: 5ac114d21b1c
Revises: 68b0d14943c1
Create Date: 2026-10-02 08:24:42.939249
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "5ac114d21b1c"
down_revision: Union[str, Sequence[str], None] = "68b0d14943c1"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create stock receipt header table.
    op.create_table(
        "stock_receipts",
        sa.Column(
            "id",
            sa.Integer(),
            nullable=False,
        ),
        sa.Column(
            "receipt_number",
            sa.String(length=50),
            nullable=False,
        ),
        sa.Column(
            "purchase_order_id",
            sa.Integer(),
            nullable=False,
        ),
        sa.Column(
            "received_date",
            sa.Date(),
            nullable=False,
        ),
        sa.Column(
            "received_by",
            sa.Integer(),
            nullable=True,
        ),
        sa.Column(
            "notes",
            sa.Text(),
            nullable=True,
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["purchase_order_id"],
            ["purchase_orders.id"],
            ondelete="RESTRICT",
        ),
        sa.ForeignKeyConstraint(
            ["received_by"],
            ["users.id"],
            ondelete="SET NULL",
        ),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_index(
        op.f("ix_stock_receipts_id"),
        "stock_receipts",
        ["id"],
        unique=False,
    )

    op.create_index(
        op.f("ix_stock_receipts_purchase_order_id"),
        "stock_receipts",
        ["purchase_order_id"],
        unique=False,
    )

    op.create_index(
        op.f("ix_stock_receipts_receipt_number"),
        "stock_receipts",
        ["receipt_number"],
        unique=True,
    )

    op.create_index(
        op.f("ix_stock_receipts_received_by"),
        "stock_receipts",
        ["received_by"],
        unique=False,
    )

    # Create stock receipt line-item table.
    op.create_table(
        "stock_receipt_items",
        sa.Column(
            "id",
            sa.Integer(),
            nullable=False,
        ),
        sa.Column(
            "receipt_id",
            sa.Integer(),
            nullable=False,
        ),
        sa.Column(
            "purchase_order_item_id",
            sa.Integer(),
            nullable=False,
        ),
        sa.Column(
            "medicine_id",
            sa.Integer(),
            nullable=False,
        ),
        sa.Column(
            "received_quantity",
            sa.Integer(),
            nullable=False,
        ),
        sa.Column(
            "unit_cost",
            sa.Numeric(
                precision=12,
                scale=2,
            ),
            nullable=False,
        ),
        sa.Column(
            "batch_number",
            sa.String(length=100),
            nullable=True,
        ),
        sa.Column(
            "expiry_date",
            sa.DateTime(timezone=True),
            nullable=True,
        ),
        sa.Column(
            "location",
            sa.String(length=150),
            nullable=True,
        ),
        sa.Column(
            "notes",
            sa.Text(),
            nullable=True,
        ),
        sa.ForeignKeyConstraint(
            ["medicine_id"],
            ["medicines.id"],
            ondelete="RESTRICT",
        ),
        sa.ForeignKeyConstraint(
            ["purchase_order_item_id"],
            ["purchase_order_items.id"],
            ondelete="RESTRICT",
        ),
        sa.ForeignKeyConstraint(
            ["receipt_id"],
            ["stock_receipts.id"],
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_index(
        op.f("ix_stock_receipt_items_batch_number"),
        "stock_receipt_items",
        ["batch_number"],
        unique=False,
    )

    op.create_index(
        op.f("ix_stock_receipt_items_expiry_date"),
        "stock_receipt_items",
        ["expiry_date"],
        unique=False,
    )

    op.create_index(
        op.f("ix_stock_receipt_items_id"),
        "stock_receipt_items",
        ["id"],
        unique=False,
    )

    op.create_index(
        op.f("ix_stock_receipt_items_location"),
        "stock_receipt_items",
        ["location"],
        unique=False,
    )

    op.create_index(
        op.f("ix_stock_receipt_items_medicine_id"),
        "stock_receipt_items",
        ["medicine_id"],
        unique=False,
    )

    op.create_index(
        op.f("ix_stock_receipt_items_purchase_order_item_id"),
        "stock_receipt_items",
        ["purchase_order_item_id"],
        unique=False,
    )

    op.create_index(
        op.f("ix_stock_receipt_items_receipt_id"),
        "stock_receipt_items",
        ["receipt_id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(
        op.f("ix_stock_receipt_items_receipt_id"),
        table_name="stock_receipt_items",
    )

    op.drop_index(
        op.f("ix_stock_receipt_items_purchase_order_item_id"),
        table_name="stock_receipt_items",
    )

    op.drop_index(
        op.f("ix_stock_receipt_items_medicine_id"),
        table_name="stock_receipt_items",
    )

    op.drop_index(
        op.f("ix_stock_receipt_items_location"),
        table_name="stock_receipt_items",
    )

    op.drop_index(
        op.f("ix_stock_receipt_items_id"),
        table_name="stock_receipt_items",
    )

    op.drop_index(
        op.f("ix_stock_receipt_items_expiry_date"),
        table_name="stock_receipt_items",
    )

    op.drop_index(
        op.f("ix_stock_receipt_items_batch_number"),
        table_name="stock_receipt_items",
    )

    op.drop_table("stock_receipt_items")

    op.drop_index(
        op.f("ix_stock_receipts_received_by"),
        table_name="stock_receipts",
    )

    op.drop_index(
        op.f("ix_stock_receipts_receipt_number"),
        table_name="stock_receipts",
    )

    op.drop_index(
        op.f("ix_stock_receipts_purchase_order_id"),
        table_name="stock_receipts",
    )

    op.drop_index(
        op.f("ix_stock_receipts_id"),
        table_name="stock_receipts",
    )

    op.drop_table("stock_receipts")
