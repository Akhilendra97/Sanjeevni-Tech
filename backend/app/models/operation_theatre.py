from __future__ import annotations

from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class OperationTheatre(Base):
    __tablename__ = "operation_theatres"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        autoincrement=True,
    )

    ot_number: Mapped[str] = mapped_column(
        String(100),
        unique=True,
        index=True,
        nullable=False,
    )

    ot_name: Mapped[str] = mapped_column(
        String(150),
        nullable=False,
    )

    ot_type: Mapped[str] = mapped_column(
        String(100),
        index=True,
        nullable=False,
    )

    department_id: Mapped[int] = mapped_column(
        ForeignKey("departments.id", ondelete="RESTRICT"),
        index=True,
        nullable=False,
    )

    patient_id: Mapped[int] = mapped_column(
        ForeignKey("patients.id", ondelete="RESTRICT"),
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

    assigned_staff_id: Mapped[int | None] = mapped_column(
        ForeignKey("staff.id", ondelete="SET NULL"),
        index=True,
        nullable=True,
    )

    surgery_type: Mapped[str] = mapped_column(
        String(30),
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

    status: Mapped[str] = mapped_column(
        String(30),
        default="scheduled",
        index=True,
        nullable=False,
    )

    preoperative_notes: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    postoperative_notes: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    equipment_notes: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
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

    department = relationship(
        "Department",
        back_populates="operation_theatres",
    )

    patient = relationship(
        "Patient",
        back_populates="operation_theatres",
    )

    surgeon = relationship(
        "Doctor",
        foreign_keys=[surgeon_id],
        back_populates="operation_theatres_as_surgeon",
    )

    anaesthetist = relationship(
        "Doctor",
        foreign_keys=[anaesthetist_id],
        back_populates="operation_theatres_as_anaesthetist",
    )

    assigned_staff = relationship(
        "Staff",
        back_populates="operation_theatres",
    )

    surgeries: Mapped[list["Surgery"]] = relationship(
        "Surgery",
        back_populates="operation_theatre",
        cascade="all, delete-orphan",
    )

