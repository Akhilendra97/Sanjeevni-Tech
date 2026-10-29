from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from typing import TYPE_CHECKING

from sqlalchemy import (
    DateTime,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.patient import Patient
    from app.models.prescription import Prescription
    from app.models.user import User


class PharmacyDispensing(Base):
    __tablename__ = "pharmacy_dispensing"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        autoincrement=True,
    )

    dispensing_number: Mapped[str] = mapped_column(
        String(50),
        unique=True,
        nullable=False,
        index=True,
    )

    prescription_id: Mapped[int] = mapped_column(
        ForeignKey(
            "prescriptions.id",
            ondelete="RESTRICT",
        ),
        nullable=False,
        index=True,
    )

    patient_id: Mapped[int] = mapped_column(
        ForeignKey(
            "patients.id",
            ondelete="RESTRICT",
        ),
        nullable=False,
        index=True,
    )

    pharmacist_id: Mapped[int | None] = mapped_column(
        ForeignKey(
            "users.id",
            ondelete="SET NULL",
        ),
        nullable=True,
        index=True,
    )

    status: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        default="pending",
        server_default="pending",
        index=True,
    )

    total_amount: Mapped[Decimal] = mapped_column(
        Numeric(12, 2),
        nullable=False,
        default=0,
        server_default="0",
    )

    notes: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    dispensed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        index=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    prescription: Mapped["Prescription"] = relationship(
        "Prescription",
    )

    patient: Mapped["Patient"] = relationship(
        "Patient",
    )

    pharmacist: Mapped["User | None"] = relationship(
        "User",
    )

    items: Mapped[list["PharmacyDispensingItem"]] = relationship(
        "PharmacyDispensingItem",
        back_populates="dispensing",
        cascade="all, delete-orphan",
    )


class PharmacyDispensingItem(Base):
    __tablename__ = "pharmacy_dispensing_items"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        autoincrement=True,
    )

    dispensing_id: Mapped[int] = mapped_column(
        ForeignKey(
            "pharmacy_dispensing.id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )

    medicine_id: Mapped[int] = mapped_column(
        ForeignKey(
            "medicines.id",
            ondelete="RESTRICT",
        ),
        nullable=False,
        index=True,
    )

    inventory_batch_id: Mapped[int] = mapped_column(
        ForeignKey(
            "inventory_batches.id",
            ondelete="RESTRICT",
        ),
        nullable=False,
        index=True,
    )

    prescribed_quantity: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    dispensed_quantity: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
        server_default="0",
    )

    unit_price: Mapped[Decimal] = mapped_column(
        Numeric(12, 2),
        nullable=False,
        default=0,
        server_default="0",
    )

    total_amount: Mapped[Decimal] = mapped_column(
        Numeric(12, 2),
        nullable=False,
        default=0,
        server_default="0",
    )

    notes: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    dispensing: Mapped["PharmacyDispensing"] = relationship(
        "PharmacyDispensing",
        back_populates="items",
    )
