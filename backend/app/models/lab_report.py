from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.lab_sample import LabSample


class LabReport(Base):
    __tablename__ = "lab_reports"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        autoincrement=True,
    )

    report_number: Mapped[str] = mapped_column(
        String(50),
        unique=True,
        nullable=False,
        index=True,
    )

    sample_id: Mapped[int] = mapped_column(
        ForeignKey(
            "lab_samples.id",
            ondelete="CASCADE",
        ),
        unique=True,
        nullable=False,
        index=True,
    )

    result: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    interpretation: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    status: Mapped[str] = mapped_column(
        String(50),
        default="completed",
        server_default="completed",
        nullable=False,
        index=True,
    )

    reported_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    remarks: Mapped[str | None] = mapped_column(
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

    sample: Mapped["LabSample"] = relationship(
        "LabSample",
        back_populates="report",
    )

    @property
    def sample_number(self) -> str | None:
        return self.sample.sample_number if self.sample is not None else None

    @property
    def patient_id(self) -> int | None:
        return self.sample.patient_id if self.sample is not None else None

    @property
    def patient_name(self) -> str | None:
        return self.sample.patient_name if self.sample is not None else None

    @property
    def patient_number(self) -> str | None:
        return self.sample.patient_number if self.sample is not None else None

    @property
    def lab_test_id(self) -> int | None:
        return self.sample.lab_test_id if self.sample is not None else None

    @property
    def test_name(self) -> str | None:
        return self.sample.test_name if self.sample is not None else None

    @property
    def test_code(self) -> str | None:
        return self.sample.test_code if self.sample is not None else None

    @property
    def sample_type(self) -> str | None:
        return self.sample.sample_type if self.sample is not None else None
