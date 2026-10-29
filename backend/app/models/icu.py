from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import (
    Boolean,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.admission import Admission
    from app.models.patient import Patient
    from app.models.doctor import Doctor
    from app.models.nurse import Nurse
    from app.models.ward import Ward
    from app.models.bed import Bed


class ICU(Base):
    __tablename__ = "icu"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        autoincrement=True,
    )

    icu_number: Mapped[str] = mapped_column(
        String(50),
        unique=True,
        nullable=False,
        index=True,
    )

    admission_id: Mapped[int] = mapped_column(
        ForeignKey(
            "admissions.id",
            ondelete="RESTRICT",
        ),
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

    nurse_id: Mapped[int | None] = mapped_column(
        ForeignKey(
            "nurses.id",
            ondelete="SET NULL",
        ),
        nullable=True,
        index=True,
    )

    ward_id: Mapped[int | None] = mapped_column(
        ForeignKey(
            "wards.id",
            ondelete="SET NULL",
        ),
        nullable=True,
        index=True,
    )

    bed_id: Mapped[int | None] = mapped_column(
        ForeignKey(
            "beds.id",
            ondelete="SET NULL",
        ),
        nullable=True,
        index=True,
    )

    icu_type: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        index=True,
    )

    admission_time: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        index=True,
    )

    discharge_time: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        index=True,
    )

    status: Mapped[str] = mapped_column(
        String(30),
        default="active",
        server_default="active",
        nullable=False,
        index=True,
    )

    diagnosis: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    treatment_plan: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    ventilator_required: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        server_default="false",
        nullable=False,
        index=True,
    )

    ventilator_start_time: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    ventilator_end_time: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
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
        foreign_keys=[admission_id],
    )

    patient: Mapped["Patient"] = relationship(
        "Patient",
        foreign_keys=[patient_id],
    )

    doctor: Mapped["Doctor"] = relationship(
        "Doctor",
        foreign_keys=[doctor_id],
    )

    nurse: Mapped["Nurse | None"] = relationship(
        "Nurse",
        foreign_keys=[nurse_id],
    )

    ward: Mapped["Ward | None"] = relationship(
        "Ward",
        foreign_keys=[ward_id],
    )

    bed: Mapped["Bed | None"] = relationship(
        "Bed",
        foreign_keys=[bed_id],
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
