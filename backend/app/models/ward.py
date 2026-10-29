from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, DateTime, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.admission import Admission
    from app.models.bed import Bed
    from app.models.housekeeping import Housekeeping


class Ward(Base):
    __tablename__ = "wards"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        autoincrement=True,
    )

    name: Mapped[str] = mapped_column(
        String(100),
        unique=True,
        nullable=False,
        index=True,
    )

    code: Mapped[str] = mapped_column(
        String(30),
        unique=True,
        nullable=False,
        index=True,
    )

    ward_type: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        index=True,
    )

    floor: Mapped[str | None] = mapped_column(
        String(50),
        nullable=True,
    )

    location: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )

    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    capacity: Mapped[int] = mapped_column(
        Integer,
        default=0,
        server_default="0",
        nullable=False,
    )

    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        server_default="true",
        nullable=False,
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

    beds: Mapped[list["Bed"]] = relationship(
        "Bed",
        back_populates="ward",
        cascade="all, delete-orphan",
    )

    admissions: Mapped[list["Admission"]] = relationship(
        "Admission",
        back_populates="ward",
    )

    housekeeping_tasks: Mapped[list["Housekeeping"]] = relationship(
        "Housekeeping",
        foreign_keys="Housekeeping.ward_id",
        back_populates="ward",
    )
