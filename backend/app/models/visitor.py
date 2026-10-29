from __future__ import annotations

from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Visitor(Base):
    __tablename__ = "visitors"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        autoincrement=True,
    )

    visitor_number: Mapped[str] = mapped_column(
        String(100),
        unique=True,
        index=True,
        nullable=False,
    )

    patient_id: Mapped[int] = mapped_column(
        ForeignKey("patients.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )

    visitor_name: Mapped[str] = mapped_column(
        String(150),
        nullable=False,
        index=True,
    )

    relationship_to_patient: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
    )

    contact_number: Mapped[str | None] = mapped_column(
        String(30),
        nullable=True,
    )

    id_proof_type: Mapped[str | None] = mapped_column(
        String(50),
        nullable=True,
    )

    id_proof_number: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
        index=True,
    )

    purpose: Mapped[str] = mapped_column(
        String(200),
        nullable=False,
    )

    entry_time: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=datetime.utcnow,
        index=True,
    )

    exit_time: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    status: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
        default="checked_in",
        index=True,
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
        back_populates="visitors",
    )
