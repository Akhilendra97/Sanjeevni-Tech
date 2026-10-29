from __future__ import annotations

from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Surgery(Base):
    __tablename__ = "surgeries"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        autoincrement=True,
    )

    surgery_number: Mapped[str] = mapped_column(
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

    operation_theatre_id: Mapped[int] = mapped_column(
        ForeignKey("operation_theatres.id", ondelete="RESTRICT"),
        index=True,
        nullable=False,
    )

    department_id: Mapped[int] = mapped_column(
        ForeignKey("departments.id", ondelete="RESTRICT"),
        index=True,
        nullable=False,
    )

    surgeon_id: Mapped[int] = mapped_column(
        ForeignKey("doctors.id", ondelete="RESTRICT"),
        index=True,
        nullable=False,
    )

    anaesthetist_id: Mapped[int | None] = mapped_column(
        ForeignKey("doctors.id", ondelete="SET NULL"),
        index=True,
        nullable=True,
    )

    procedure_name: Mapped[str] = mapped_column(
        String(200),
        index=True,
        nullable=False,
    )

    surgery_type: Mapped[str] = mapped_column(
        String(50),
        default="elective",
        index=True,
        nullable=False,
    )

    scheduled_start: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        index=True,
        nullable=False,
    )

    scheduled_end: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        index=True,
        nullable=False,
    )

    actual_start: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    actual_end: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    preoperative_diagnosis: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    postoperative_diagnosis: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    procedure_details: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    anaesthesia_type: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
    )

    findings: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    complications: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    postoperative_instructions: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    status: Mapped[str] = mapped_column(
        String(30),
        default="scheduled",
        index=True,
        nullable=False,
    )

    cancellation_reason: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
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
        back_populates="surgeries",
    )

    operation_theatre = relationship(
        "OperationTheatre",
        back_populates="surgeries",
    )

    department = relationship(
        "Department",
        back_populates="surgeries",
    )

    surgeon = relationship(
        "Doctor",
        foreign_keys=[surgeon_id],
        back_populates="surgeries_as_surgeon",
    )

    anaesthetist = relationship(
        "Doctor",
        foreign_keys=[anaesthetist_id],
        back_populates="surgeries_as_anaesthetist",
    )
