from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.doctor import Doctor
    from app.models.patient import Patient
    from app.models.user import User


class Emergency(Base):
    __tablename__ = "emergencies"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        autoincrement=True,
    )

    emergency_number: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        unique=True,
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

    doctor_id: Mapped[int | None] = mapped_column(
        ForeignKey(
            "doctors.id",
            ondelete="SET NULL",
        ),
        nullable=True,
        index=True,
    )

    registered_by: Mapped[int | None] = mapped_column(
        ForeignKey(
            "users.id",
            ondelete="SET NULL",
        ),
        nullable=True,
        index=True,
    )

    arrival_time: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        index=True,
    )

    triage_level: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
        index=True,
    )

    chief_complaint: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    symptoms: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    initial_assessment: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    treatment: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    status: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        default="active",
        index=True,
    )

    disposition: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
        index=True,
    )

    discharge_time: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
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

    patient: Mapped["Patient"] = relationship(
        "Patient",
        back_populates="emergencies",
    )

    doctor: Mapped["Doctor | None"] = relationship(
        "Doctor",
        foreign_keys=[doctor_id],
    )

    registered_by_user: Mapped["User | None"] = relationship(
        "User",
        foreign_keys=[registered_by],
    )

    triage_records = relationship(
        "Triage",
        back_populates="emergency",
        cascade="all, delete-orphan",
    )

    queue_entries = relationship(
        "Queue",
        back_populates="emergency",
        cascade="all, delete-orphan",
    )
