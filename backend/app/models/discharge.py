from __future__ import annotations

from datetime import date, datetime
from typing import TYPE_CHECKING

from sqlalchemy import Date, DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.admission import Admission
    from app.models.doctor import Doctor
    from app.models.patient import Patient


class Discharge(Base):
    __tablename__ = "discharges"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        autoincrement=True,
    )

    admission_id: Mapped[int] = mapped_column(
        ForeignKey(
            "admissions.id",
            ondelete="RESTRICT",
        ),
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

    discharge_number: Mapped[str] = mapped_column(
        String(50),
        unique=True,
        nullable=False,
        index=True,
    )

    discharge_date: Mapped[date] = mapped_column(
        Date,
        nullable=False,
        index=True,
    )

    discharge_type: Mapped[str] = mapped_column(
        String(50),
        default="normal",
        server_default="normal",
        nullable=False,
        index=True,
    )

    final_diagnosis: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    treatment_summary: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    medications: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    follow_up_instructions: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    condition_at_discharge: Mapped[str | None] = mapped_column(
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

    admission: Mapped["Admission"] = relationship(
        "Admission",
        back_populates="discharge",
    )

    patient: Mapped["Patient"] = relationship(
        "Patient",
        back_populates="discharges",
    )

    doctor: Mapped["Doctor"] = relationship(
        "Doctor",
        back_populates="discharges",
    )