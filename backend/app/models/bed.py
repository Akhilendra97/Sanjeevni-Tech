from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import (
    Boolean,
    DateTime,
    ForeignKey,
    Integer,
    String,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.constants import BedStatus
from app.core.database import Base

if TYPE_CHECKING:
    from app.models.admission import Admission
    from app.models.ward import Ward
    from app.models.housekeeping import Housekeeping


class Bed(Base):
    __tablename__ = "beds"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        autoincrement=True,
    )

    ward_id: Mapped[int] = mapped_column(
        ForeignKey(
            "wards.id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )

    bed_number: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        index=True,
    )

    bed_type: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
    )

    status: Mapped[str] = mapped_column(
        String(30),
        default=BedStatus.AVAILABLE.value,
        server_default=BedStatus.AVAILABLE.value,
        nullable=False,
        index=True,
    )

    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        server_default="true",
        nullable=False,
    )

    notes: Mapped[str | None] = mapped_column(
        String(500),
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

    ward: Mapped["Ward"] = relationship(
        "Ward",
        back_populates="beds",
    )

    admissions: Mapped[list["Admission"]] = relationship(
        "Admission",
        back_populates="bed",
    )

    housekeeping_tasks: Mapped[list["Housekeeping"]] = relationship(
        "Housekeeping",
        foreign_keys="Housekeeping.bed_id",
        back_populates="bed",
    )
