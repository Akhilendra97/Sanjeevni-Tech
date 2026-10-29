from __future__ import annotations

from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Queue(Base):
    __tablename__ = "queues"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        autoincrement=True,
    )

    queue_number: Mapped[str] = mapped_column(
        String(100),
        unique=True,
        index=True,
        nullable=False,
    )

    token_number: Mapped[int] = mapped_column(
        Integer,
        index=True,
        nullable=False,
    )

    patient_id: Mapped[int] = mapped_column(
        ForeignKey("patients.id", ondelete="RESTRICT"),
        index=True,
        nullable=False,
    )

    appointment_id: Mapped[int | None] = mapped_column(
        ForeignKey("appointments.id", ondelete="SET NULL"),
        index=True,
        nullable=True,
    )

    emergency_id: Mapped[int | None] = mapped_column(
        ForeignKey("emergencies.id", ondelete="SET NULL"),
        index=True,
        nullable=True,
    )

    doctor_id: Mapped[int | None] = mapped_column(
        ForeignKey("doctors.id", ondelete="SET NULL"),
        index=True,
        nullable=True,
    )

    department_id: Mapped[int] = mapped_column(
        ForeignKey("departments.id", ondelete="RESTRICT"),
        index=True,
        nullable=False,
    )

    queue_type: Mapped[str] = mapped_column(
        String(50),
        index=True,
        nullable=False,
        default="opd",
    )

    priority: Mapped[int] = mapped_column(
        Integer,
        index=True,
        nullable=False,
        default=0,
    )

    status: Mapped[str] = mapped_column(
        String(30),
        index=True,
        nullable=False,
        default="waiting",
    )

    check_in_time: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        index=True,
        nullable=False,
        default=datetime.utcnow,
    )

    called_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    service_start_time: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    service_end_time: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
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
        back_populates="queue_entries",
    )

    appointment = relationship(
        "Appointment",
        back_populates="queue_entries",
    )

    emergency = relationship(
        "Emergency",
        back_populates="queue_entries",
    )

    doctor = relationship(
        "Doctor",
        back_populates="queue_entries",
    )

    department = relationship(
        "Department",
        back_populates="queue_entries",
    )
