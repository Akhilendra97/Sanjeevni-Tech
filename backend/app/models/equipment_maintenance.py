from __future__ import annotations

from datetime import date, datetime
from typing import TYPE_CHECKING

from sqlalchemy import (
    Date,
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
    from app.models.equipment import Equipment


class EquipmentMaintenance(Base):
    __tablename__ = "equipment_maintenance"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        autoincrement=True,
    )

    equipment_id: Mapped[int] = mapped_column(
        ForeignKey(
            "equipment.id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )

    maintenance_type: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        index=True,
    )

    maintenance_date: Mapped[date] = mapped_column(
        Date,
        nullable=False,
        index=True,
    )

    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    performed_by: Mapped[str | None] = mapped_column(
        String(150),
        nullable=True,
    )

    status: Mapped[str] = mapped_column(
        String(50),
        default="completed",
        server_default="completed",
        nullable=False,
        index=True,
    )

    next_maintenance_date: Mapped[date | None] = mapped_column(
        Date,
        nullable=True,
    )

    cost: Mapped[float | None] = mapped_column(
        Numeric(12, 2),
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

    equipment: Mapped["Equipment"] = relationship(
        "Equipment",
        back_populates="maintenance_records",
    )
