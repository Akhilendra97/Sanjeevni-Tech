"""add blood bank module

Revision ID: 24c2619774dc
Revises: fe018bd979f7
Create Date: 2026-10-01

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "24c2619774dc"
down_revision: Union[str, Sequence[str], None] = "fe018bd979f7"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Create Blood Bank tables."""

    # =========================
    # BLOOD BANKS
    # =========================

    op.create_table(
        "blood_banks",
        sa.Column(
            "id",
            sa.Integer(),
            autoincrement=True,
            nullable=False,
        ),
        sa.Column(
            "name",
            sa.String(length=150),
            nullable=False,
        ),
        sa.Column(
            "code",
            sa.String(length=50),
            nullable=False,
        ),
        sa.Column(
            "location",
            sa.String(length=255),
            nullable=True,
        ),
        sa.Column(
            "contact_number",
            sa.String(length=20),
            nullable=True,
        ),
        sa.Column(
            "email",
            sa.String(length=255),
            nullable=True,
        ),
        sa.Column(
            "license_number",
            sa.String(length=100),
            nullable=True,
        ),
        sa.Column(
            "is_active",
            sa.Boolean(),
            server_default=sa.text("true"),
            nullable=False,
        ),
        sa.Column(
            "notes",
            sa.Text(),
            nullable=True,
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("code"),
        sa.UniqueConstraint("license_number"),
    )

    op.create_index(
        "ix_blood_banks_name",
        "blood_banks",
        ["name"],
        unique=False,
    )

    op.create_index(
        "ix_blood_banks_code",
        "blood_banks",
        ["code"],
        unique=False,
    )

    op.create_index(
        "ix_blood_banks_is_active",
        "blood_banks",
        ["is_active"],
        unique=False,
    )

    # =========================
    # BLOOD REQUESTS
    # =========================

    op.create_table(
        "blood_requests",
        sa.Column(
            "id",
            sa.Integer(),
            autoincrement=True,
            nullable=False,
        ),
        sa.Column(
            "request_number",
            sa.String(length=50),
            nullable=False,
        ),
        sa.Column(
            "blood_bank_id",
            sa.Integer(),
            nullable=False,
        ),
        sa.Column(
            "patient_id",
            sa.Integer(),
            nullable=False,
        ),
        sa.Column(
            "blood_group",
            sa.String(length=10),
            nullable=False,
        ),
        sa.Column(
            "component_type",
            sa.String(length=50),
            nullable=False,
        ),
        sa.Column(
            "units_required",
            sa.Integer(),
            nullable=False,
        ),
        sa.Column(
            "priority",
            sa.String(length=30),
            server_default="normal",
            nullable=False,
        ),
        sa.Column(
            "status",
            sa.String(length=30),
            server_default="pending",
            nullable=False,
        ),
        sa.Column(
            "reason",
            sa.Text(),
            nullable=True,
        ),
        sa.Column(
            "notes",
            sa.Text(),
            nullable=True,
        ),
        sa.Column(
            "requested_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "fulfilled_at",
            sa.DateTime(timezone=True),
            nullable=True,
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["blood_bank_id"],
            ["blood_banks.id"],
            ondelete="RESTRICT",
        ),
        sa.ForeignKeyConstraint(
            ["patient_id"],
            ["patients.id"],
            ondelete="RESTRICT",
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("request_number"),
    )

    op.create_index(
        "ix_blood_requests_request_number",
        "blood_requests",
        ["request_number"],
        unique=False,
    )

    op.create_index(
        "ix_blood_requests_blood_bank_id",
        "blood_requests",
        ["blood_bank_id"],
        unique=False,
    )

    op.create_index(
        "ix_blood_requests_patient_id",
        "blood_requests",
        ["patient_id"],
        unique=False,
    )

    op.create_index(
        "ix_blood_requests_blood_group",
        "blood_requests",
        ["blood_group"],
        unique=False,
    )

    op.create_index(
        "ix_blood_requests_priority",
        "blood_requests",
        ["priority"],
        unique=False,
    )

    op.create_index(
        "ix_blood_requests_status",
        "blood_requests",
        ["status"],
        unique=False,
    )

    op.create_index(
        "ix_blood_requests_requested_at",
        "blood_requests",
        ["requested_at"],
        unique=False,
    )

    # =========================
    # BLOOD UNITS
    # =========================

    op.create_table(
        "blood_units",
        sa.Column(
            "id",
            sa.Integer(),
            autoincrement=True,
            nullable=False,
        ),
        sa.Column(
            "blood_bank_id",
            sa.Integer(),
            nullable=False,
        ),
        sa.Column(
            "unit_number",
            sa.String(length=50),
            nullable=False,
        ),
        sa.Column(
            "blood_group",
            sa.String(length=10),
            nullable=False,
        ),
        sa.Column(
            "component_type",
            sa.String(length=50),
            nullable=False,
        ),
        sa.Column(
            "collection_date",
            sa.Date(),
            nullable=False,
        ),
        sa.Column(
            "expiry_date",
            sa.Date(),
            nullable=False,
        ),
        sa.Column(
            "volume_ml",
            sa.Integer(),
            nullable=True,
        ),
        sa.Column(
            "status",
            sa.String(length=30),
            server_default="available",
            nullable=False,
        ),
        sa.Column(
            "donor_id",
            sa.String(length=100),
            nullable=True,
        ),
        sa.Column(
            "storage_location",
            sa.String(length=100),
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
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["blood_bank_id"],
            ["blood_banks.id"],
            ondelete="RESTRICT",
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("unit_number"),
    )

    op.create_index(
        "ix_blood_units_blood_bank_id",
        "blood_units",
        ["blood_bank_id"],
        unique=False,
    )

    op.create_index(
        "ix_blood_units_unit_number",
        "blood_units",
        ["unit_number"],
        unique=False,
    )

    op.create_index(
        "ix_blood_units_blood_group",
        "blood_units",
        ["blood_group"],
        unique=False,
    )

    op.create_index(
        "ix_blood_units_component_type",
        "blood_units",
        ["component_type"],
        unique=False,
    )

    op.create_index(
        "ix_blood_units_expiry_date",
        "blood_units",
        ["expiry_date"],
        unique=False,
    )

    op.create_index(
        "ix_blood_units_status",
        "blood_units",
        ["status"],
        unique=False,
    )


def downgrade() -> None:
    """Remove Blood Bank tables."""

    op.drop_index(
        "ix_blood_units_status",
        table_name="blood_units",
    )

    op.drop_index(
        "ix_blood_units_expiry_date",
        table_name="blood_units",
    )

    op.drop_index(
        "ix_blood_units_component_type",
        table_name="blood_units",
    )

    op.drop_index(
        "ix_blood_units_blood_group",
        table_name="blood_units",
    )

    op.drop_index(
        "ix_blood_units_unit_number",
        table_name="blood_units",
    )

    op.drop_index(
        "ix_blood_units_blood_bank_id",
        table_name="blood_units",
    )

    op.drop_table("blood_units")

    op.drop_index(
        "ix_blood_requests_requested_at",
        table_name="blood_requests",
    )

    op.drop_index(
        "ix_blood_requests_status",
        table_name="blood_requests",
    )

    op.drop_index(
        "ix_blood_requests_priority",
        table_name="blood_requests",
    )

    op.drop_index(
        "ix_blood_requests_blood_group",
        table_name="blood_requests",
    )

    op.drop_index(
        "ix_blood_requests_patient_id",
        table_name="blood_requests",
    )

    op.drop_index(
        "ix_blood_requests_blood_bank_id",
        table_name="blood_requests",
    )

    op.drop_index(
        "ix_blood_requests_request_number",
        table_name="blood_requests",
    )

    op.drop_table("blood_requests")

    op.drop_index(
        "ix_blood_banks_is_active",
        table_name="blood_banks",
    )

    op.drop_index(
        "ix_blood_banks_code",
        table_name="blood_banks",
    )

    op.drop_index(
        "ix_blood_banks_name",
        table_name="blood_banks",
    )

    op.drop_table("blood_banks")