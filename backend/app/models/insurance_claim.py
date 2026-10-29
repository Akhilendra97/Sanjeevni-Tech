from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import Date, DateTime, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class InsuranceClaim(Base):
    __tablename__ = "insurance_claims"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        autoincrement=True,
    )

    claim_number: Mapped[str] = mapped_column(
        String(100),
        unique=True,
        index=True,
        nullable=False,
    )

    insurance_id: Mapped[int] = mapped_column(
        ForeignKey("insurances.id", ondelete="RESTRICT"),
        index=True,
        nullable=False,
    )

    patient_id: Mapped[int] = mapped_column(
        ForeignKey("patients.id", ondelete="RESTRICT"),
        index=True,
        nullable=False,
    )

    claim_date: Mapped[date] = mapped_column(
        Date,
        index=True,
        nullable=False,
    )

    admission_id: Mapped[int | None] = mapped_column(
        ForeignKey("admissions.id", ondelete="SET NULL"),
        index=True,
        nullable=True,
    )

    claim_amount: Mapped[Decimal] = mapped_column(
        Numeric(14, 2),
        nullable=False,
    )

    approved_amount: Mapped[Decimal] = mapped_column(
        Numeric(14, 2),
        default=0,
        nullable=False,
    )

    rejected_amount: Mapped[Decimal] = mapped_column(
        Numeric(14, 2),
        default=0,
        nullable=False,
    )

    status: Mapped[str] = mapped_column(
        String(30),
        default="submitted",
        index=True,
        nullable=False,
    )

    settlement_date: Mapped[date | None] = mapped_column(
        Date,
        nullable=True,
    )

    rejection_reason: Mapped[str | None] = mapped_column(
        Text,
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

    insurance = relationship(
        "Insurance",
        back_populates="claims",
    )

    patient = relationship(
        "Patient",
        back_populates="insurance_claims",
    )

    admission = relationship(
        "Admission",
        back_populates="insurance_claims",
    )

    @property
    def patient_name(self) -> str | None:
        if not self.patient:
            return None
        return self.patient.full_name

    @property
    def insurance_provider(self) -> str | None:
        return self.insurance.insurance_provider if self.insurance else None

    @property
    def insurance_policy_number(self) -> str | None:
        return self.insurance.policy_number if self.insurance else None
