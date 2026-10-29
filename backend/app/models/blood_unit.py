from __future__ import annotations

from datetime import date, datetime
from typing import TYPE_CHECKING

from sqlalchemy import Date, DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.blood_bank import BloodBank


class BloodUnit(Base):
    __tablename__ = "blood_units"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        autoincrement=True,
    )

    blood_bank_id: Mapped[int] = mapped_column(
        ForeignKey(
            "blood_banks.id",
            ondelete="RESTRICT",
        ),
        nullable=False,
        index=True,
    )

    unit_number: Mapped[str] = mapped_column(
        String(50),
        unique=True,
        nullable=False,
        index=True,
    )

    blood_group: Mapped[str] = mapped_column(
        String(10),
        nullable=False,
        index=True,
    )

    component_type: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        index=True,
    )

    collection_date: Mapped[date] = mapped_column(
        Date,
        nullable=False,
    )

    expiry_date: Mapped[date] = mapped_column(
        Date,
        nullable=False,
        index=True,
    )

    volume_ml: Mapped[float | None] = mapped_column(
        Integer,
        nullable=True,
    )

    status: Mapped[str] = mapped_column(
        String(30),
        default="available",
        server_default="available",
        nullable=False,
        index=True,
    )

    donor_id: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
    )

    storage_location: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
    )

    notes: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
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

    blood_bank: Mapped["BloodBank"] = relationship(
        "BloodBank",
        back_populates="blood_units",
    )