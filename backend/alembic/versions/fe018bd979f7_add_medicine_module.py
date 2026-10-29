from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "fe018bd979f7"
down_revision: Union[str, Sequence[str], None] = "687bad548284"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "medicines",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("medicine_code", sa.String(length=50), nullable=False),
        sa.Column("name", sa.String(length=150), nullable=False),
        sa.Column("generic_name", sa.String(length=150), nullable=True),
        sa.Column("category", sa.String(length=100), nullable=False),
        sa.Column("manufacturer", sa.String(length=150), nullable=True),
        sa.Column("dosage_form", sa.String(length=100), nullable=True),
        sa.Column("strength", sa.String(length=100), nullable=True),
        sa.Column("unit", sa.String(length=50), server_default="unit", nullable=False),
        sa.Column("purchase_price", sa.Numeric(precision=12, scale=2), server_default="0", nullable=False),
        sa.Column("selling_price", sa.Numeric(precision=12, scale=2), server_default="0", nullable=False),
        sa.Column("stock_quantity", sa.Integer(), server_default="0", nullable=False),
        sa.Column("reorder_level", sa.Integer(), server_default="10", nullable=False),
        sa.Column("expiry_date", sa.DateTime(timezone=True), nullable=True),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("is_active", sa.Boolean(), server_default=sa.text("true"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("medicine_code"),
    )

    op.create_index(
        "ix_medicines_medicine_code",
        "medicines",
        ["medicine_code"],
        unique=False,
    )

    op.create_index(
        "ix_medicines_name",
        "medicines",
        ["name"],
        unique=False,
    )

    op.create_index(
        "ix_medicines_generic_name",
        "medicines",
        ["generic_name"],
        unique=False,
    )

    op.create_index(
        "ix_medicines_category",
        "medicines",
        ["category"],
        unique=False,
    )

    op.create_index(
        "ix_medicines_expiry_date",
        "medicines",
        ["expiry_date"],
        unique=False,
    )

    op.create_index(
        "ix_medicines_is_active",
        "medicines",
        ["is_active"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index("ix_medicines_is_active", table_name="medicines")
    op.drop_index("ix_medicines_expiry_date", table_name="medicines")
    op.drop_index("ix_medicines_category", table_name="medicines")
    op.drop_index("ix_medicines_generic_name", table_name="medicines")
    op.drop_index("ix_medicines_name", table_name="medicines")
    op.drop_index("ix_medicines_medicine_code", table_name="medicines")
    op.drop_table("medicines")
