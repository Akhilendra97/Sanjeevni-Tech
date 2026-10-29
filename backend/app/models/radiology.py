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
    from app.models.patient import Patient
    from app.models.doctor import Doctor
    from app.models.imaging_study import ImagingStudy


class Radiology(Base):
    __tablename__ = "radiology"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        autoincrement=True,
    )

    radiology_number: Mapped[str] = mapped_column(
        String(50),
        unique=True,
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

    doctor_id: Mapped[int] = mapped_column(
        ForeignKey(
            "doctors.id",
            ondelete="RESTRICT",
        ),
        nullable=False,
        index=True,
    )

    examination_type: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        index=True,
    )

    body_part: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        index=True,
    )

    clinical_indication: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    priority: Mapped[str] = mapped_column(
        String(30),
        default="routine",
        server_default="routine",
        nullable=False,
        index=True,
    )

    status: Mapped[str] = mapped_column(
        String(30),
        default="ordered",
        server_default="ordered",
        nullable=False,
        index=True,
    )

    requested_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
        index=True,
    )

    scheduled_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        index=True,
    )

    performed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        index=True,
    )

    contrast_used: Mapped[bool] = mapped_column(
        default=False,
        server_default="false",
        nullable=False,
        index=True,
    )

    contrast_details: Mapped[str | None] = mapped_column(
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

    patient: Mapped["Patient"] = relationship(
        "Patient",
        foreign_keys=[patient_id],
        back_populates="radiology_records",
    )

    doctor: Mapped["Doctor"] = relationship(
        "Doctor",
        foreign_keys=[doctor_id],
        back_populates="radiology_orders",
    )

    imaging_studies: Mapped[list["ImagingStudy"]] = relationship(
        "ImagingStudy",
        back_populates="radiology",
        cascade="all, delete-orphan",
    )

    @property
    def doctor_name(self) -> str | None:
        doctor = self.doctor
        user = getattr(doctor, "user", None) if doctor is not None else None
        return getattr(user, "full_name", None)
