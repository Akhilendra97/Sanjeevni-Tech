from __future__ import annotations

from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class NursingCarePlan(Base):
    __tablename__ = "nursing_care_plans"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        autoincrement=True,
    )

    care_plan_number: Mapped[str] = mapped_column(
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

    admission_id: Mapped[int | None] = mapped_column(
        ForeignKey("admissions.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    nurse_id: Mapped[int | None] = mapped_column(
        ForeignKey("nurses.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    assessment: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    nursing_diagnosis: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    goals: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    interventions: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    expected_outcome: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    evaluation: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    priority: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
        default="medium",
        index=True,
    )

    status: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
        default="active",
        index=True,
    )

    start_date: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=datetime.utcnow,
        index=True,
    )

    review_date: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    completed_at: Mapped[datetime | None] = mapped_column(
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
        back_populates="nursing_care_plans",
    )

    admission = relationship(
        "Admission",
        back_populates="nursing_care_plans",
    )

    nurse = relationship(
        "Nurse",
        back_populates="nursing_care_plans",
    )

    @property
    def nurse_name(self) -> str | None:
        return self.nurse.user.full_name if self.nurse is not None and self.nurse.user is not None else None


    @property
    def nurse_username(self) -> str | None:
        return self.nurse.user.username if self.nurse is not None and self.nurse.user is not None else None

    @property
    def nurse_employee_id(self) -> str | None:
        return self.nurse.employee_id if self.nurse is not None else None

    @property
    def nurse_department_name(self) -> str | None:
        return self.nurse.department.name if self.nurse is not None and self.nurse.department is not None else None
