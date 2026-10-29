from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.patient import Patient
    from app.models.lab_test import LabTest
    from app.models.lab_report import LabReport


class LabSample(Base):
    __tablename__ = "lab_samples"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        autoincrement=True,
    )

    sample_number: Mapped[str] = mapped_column(
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

    lab_test_id: Mapped[int] = mapped_column(
        ForeignKey(
            "lab_tests.id",
            ondelete="RESTRICT",
        ),
        nullable=False,
        index=True,
    )

    collected_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    received_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    status: Mapped[str] = mapped_column(
        String(50),
        default="collected",
        server_default="collected",
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

    patient: Mapped["Patient"] = relationship(
        "Patient",
    )

    lab_test: Mapped["LabTest"] = relationship(
        "LabTest",
        back_populates="samples",
    )

    report: Mapped["LabReport | None"] = relationship(
        "LabReport",
        back_populates="sample",
        uselist=False,
        cascade="all, delete-orphan",
    )

    @property
    def patient_name(self) -> str | None:
        patient = self.patient
        if patient is None:
            return None
        parts = [patient.first_name, patient.middle_name, patient.last_name]
        return " ".join(part.strip() for part in parts if part and part.strip())

    @property
    def patient_number(self) -> str | None:
        return self.patient.patient_number if self.patient is not None else None

    @property
    def test_name(self) -> str | None:
        return self.lab_test.name if self.lab_test is not None else None

    @property
    def test_code(self) -> str | None:
        return self.lab_test.test_code if self.lab_test is not None else None

    @property
    def test_category(self) -> str | None:
        return self.lab_test.category if self.lab_test is not None else None

    @property
    def sample_type(self) -> str | None:
        return self.lab_test.sample_type if self.lab_test is not None else None
