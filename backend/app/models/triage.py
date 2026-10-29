from __future__ import annotations

from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Triage(Base):
    __tablename__ = "triages"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        autoincrement=True,
    )

    triage_number: Mapped[str] = mapped_column(
        String(100),
        unique=True,
        index=True,
        nullable=False,
    )

    emergency_id: Mapped[int] = mapped_column(
        ForeignKey("emergencies.id", ondelete="RESTRICT"),
        index=True,
        nullable=False,
    )

    patient_id: Mapped[int] = mapped_column(
        ForeignKey("patients.id", ondelete="RESTRICT"),
        index=True,
        nullable=False,
    )

    assessed_by: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"),
        index=True,
        nullable=True,
    )

    triage_level: Mapped[str] = mapped_column(
        String(30),
        index=True,
        nullable=False,
        default="urgent",
    )

    priority_score: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
    )

    chief_complaint: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    symptoms: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    pain_score: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
    )

    consciousness_level: Mapped[str | None] = mapped_column(
        String(50),
        nullable=True,
    )

    temperature: Mapped[str | None] = mapped_column(
        String(30),
        nullable=True,
    )

    heart_rate: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
    )

    respiratory_rate: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
    )

    oxygen_saturation: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
    )

    systolic_bp: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
    )

    diastolic_bp: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
    )

    assessment: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    immediate_intervention: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    recommended_department: Mapped[str | None] = mapped_column(
        String(150),
        nullable=True,
    )

    status: Mapped[str] = mapped_column(
        String(30),
        index=True,
        nullable=False,
        default="active",
    )

    assessed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        index=True,
        nullable=False,
        default=datetime.utcnow,
    )

    reassessed_at: Mapped[datetime | None] = mapped_column(
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

    emergency = relationship(
        "Emergency",
        back_populates="triage_records",
    )

    patient = relationship(
        "Patient",
        back_populates="triage_records",
    )

    assessed_by_user = relationship(
        "User",
        back_populates="triage_assessments",
        foreign_keys=[assessed_by],
    )
