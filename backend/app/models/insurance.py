from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import Boolean, Date, DateTime, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Insurance(Base):
    __tablename__ = "insurances"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        autoincrement=True,
    )

    policy_number: Mapped[str] = mapped_column(
        String(100),
        unique=True,
        index=True,
        nullable=False,
    )

    patient_id: Mapped[int] = mapped_column(
        ForeignKey("patients.id", ondelete="RESTRICT"),
        index=True,
        nullable=False,
    )

    insurance_provider: Mapped[str] = mapped_column(
        String(150),
        index=True,
        nullable=False,
    )

    policy_type: Mapped[str] = mapped_column(
        String(100),
        index=True,
        nullable=False,
    )

    policy_holder_name: Mapped[str] = mapped_column(
        String(150),
        nullable=False,
    )

    policy_holder_relation: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
    )

    policy_start_date: Mapped[date] = mapped_column(
        Date,
        nullable=False,
    )

    policy_end_date: Mapped[date] = mapped_column(
        Date,
        index=True,
        nullable=False,
    )

    sum_insured: Mapped[Decimal] = mapped_column(
        Numeric(14, 2),
        nullable=False,
    )

    coverage_percentage: Mapped[Decimal] = mapped_column(
        Numeric(5, 2),
        nullable=False,
    )

    deductible_amount: Mapped[Decimal] = mapped_column(
        Numeric(14, 2),
        default=0,
        nullable=False,
    )

    status: Mapped[str] = mapped_column(
        String(30),
        default="active",
        index=True,
        nullable=False,
    )

    is_primary: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        index=True,
        nullable=False,
    )

    notes: Mapped[str | None] = mapped_column(
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

    patient = relationship(
        "Patient",
        back_populates="insurance_policies",
    )

    claims = relationship(
        "InsuranceClaim",
        back_populates="insurance",
        cascade="all, delete-orphan",
    )
