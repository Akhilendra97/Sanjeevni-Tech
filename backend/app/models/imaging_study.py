from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import (
    Boolean,
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
    from app.models.radiology import Radiology
    from app.models.imaging_report import ImagingReport


class ImagingStudy(Base):
    __tablename__ = "imaging_studies"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        autoincrement=True,
    )

    study_number: Mapped[str] = mapped_column(
        String(50),
        unique=True,
        nullable=False,
        index=True,
    )

    radiology_id: Mapped[int] = mapped_column(
        ForeignKey(
            "radiology.id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )

    modality: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        index=True,
    )

    study_description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    body_part: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        index=True,
    )

    study_date: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        index=True,
    )

    completion_date: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        index=True,
    )

    performed_by: Mapped[str | None] = mapped_column(
        String(150),
        nullable=True,
    )

    equipment_name: Mapped[str | None] = mapped_column(
        String(150),
        nullable=True,
    )

    image_count: Mapped[int] = mapped_column(
        Integer,
        default=0,
        server_default="0",
        nullable=False,
    )

    image_storage_path: Mapped[str | None] = mapped_column(
        String(500),
        nullable=True,
    )

    is_completed: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        server_default="false",
        nullable=False,
        index=True,
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

    radiology: Mapped["Radiology"] = relationship(
        "Radiology",
        foreign_keys=[radiology_id],
        back_populates="imaging_studies",
    )

    report: Mapped["ImagingReport | None"] = relationship(
        "ImagingReport",
        back_populates="study",
        uselist=False,
        cascade="all, delete-orphan",
    )
