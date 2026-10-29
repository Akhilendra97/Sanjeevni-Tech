from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import (
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.ward import Ward
    from app.models.bed import Bed
    from app.models.staff import Staff


class Housekeeping(Base):
    __tablename__ = "housekeeping"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        autoincrement=True,
    )

    task_number: Mapped[str] = mapped_column(
        String(50),
        unique=True,
        nullable=False,
        index=True,
    )

    ward_id: Mapped[int] = mapped_column(
        ForeignKey(
            "wards.id",
            ondelete="RESTRICT",
        ),
        nullable=False,
        index=True,
    )

    bed_id: Mapped[int | None] = mapped_column(
        ForeignKey(
            "beds.id",
            ondelete="SET NULL",
        ),
        nullable=True,
        index=True,
    )

    assigned_to: Mapped[int | None] = mapped_column(
        ForeignKey(
            "staff.id",
            ondelete="SET NULL",
        ),
        nullable=True,
        index=True,
    )

    task_type: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        index=True,
    )

    priority: Mapped[str] = mapped_column(
        String(30),
        default="normal",
        server_default="normal",
        nullable=False,
        index=True,
    )

    status: Mapped[str] = mapped_column(
        String(30),
        default="pending",
        server_default="pending",
        nullable=False,
        index=True,
    )

    scheduled_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        index=True,
    )

    started_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    completed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    description: Mapped[str | None] = mapped_column(
        Text,
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

    ward: Mapped["Ward"] = relationship(
        "Ward",
        foreign_keys=[ward_id],
        back_populates="housekeeping_tasks",
    )

    bed: Mapped["Bed | None"] = relationship(
        "Bed",
        foreign_keys=[bed_id],
        back_populates="housekeeping_tasks",
    )

    assigned_staff: Mapped["Staff | None"] = relationship(
        "Staff",
        foreign_keys=[assigned_to],
        back_populates="housekeeping_tasks",
    )
