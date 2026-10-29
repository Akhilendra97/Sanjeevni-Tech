from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import Date, DateTime, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Payment(Base):
    __tablename__ = "payments"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        autoincrement=True,
    )

    payment_number: Mapped[str] = mapped_column(
        String(100),
        unique=True,
        index=True,
        nullable=False,
    )

    invoice_id: Mapped[int] = mapped_column(
        ForeignKey("invoices.id", ondelete="RESTRICT"),
        index=True,
        nullable=False,
    )

    patient_id: Mapped[int] = mapped_column(
        ForeignKey("patients.id", ondelete="RESTRICT"),
        index=True,
        nullable=False,
    )

    payment_date: Mapped[date] = mapped_column(
        Date,
        index=True,
        nullable=False,
    )

    amount: Mapped[Decimal] = mapped_column(
        Numeric(14, 2),
        nullable=False,
    )

    payment_method: Mapped[str] = mapped_column(
        String(50),
        index=True,
        nullable=False,
    )

    transaction_reference: Mapped[str | None] = mapped_column(
        String(150),
        unique=True,
        index=True,
        nullable=True,
    )

    status: Mapped[str] = mapped_column(
        String(30),
        default="completed",
        index=True,
        nullable=False,
    )

    received_by: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"),
        index=True,
        nullable=True,
    )

    remarks: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default="now()",
        nullable=False,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default="now()",
        nullable=False,
    )

    @property
    def patient_name(self) -> str | None:
        patient = getattr(self, "patient", None)
        if patient is None:
            return None
        return getattr(patient, "display_name", None) or " ".join(
            part for part in (
                getattr(patient, "first_name", None),
                getattr(patient, "middle_name", None),
                getattr(patient, "last_name", None),
            ) if part
        )

    invoice = relationship(
        "Invoice",
        back_populates="payments",
    )

    patient = relationship(
        "Patient",
        back_populates="payments",
    )

    received_by_user = relationship(
        "User",
        back_populates="received_payments",
    )
