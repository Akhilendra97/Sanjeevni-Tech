from __future__ import annotations

from datetime import date, datetime
from typing import TYPE_CHECKING

from sqlalchemy import Date, DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.constants import AdmissionStatus
from app.core.database import Base
from app.models.ward import Ward
from app.models.bed import Bed

if TYPE_CHECKING:
    from .invoice import Invoice
    from .insurance_claim import InsuranceClaim
    from app.models.patient import Patient
    from app.models.doctor import Doctor
    from app.models.discharge import Discharge
    


class Admission(Base):
    __tablename__ = "admissions"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        autoincrement=True,
    )

    admission_number: Mapped[str] = mapped_column(
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

    doctor_id: Mapped[int] = mapped_column(
        ForeignKey(
            "doctors.id",
            ondelete="RESTRICT",
        ),
        nullable=False,
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

    admission_date: Mapped[date] = mapped_column(
        Date,
        nullable=False,
        index=True,
    )

    discharge_date: Mapped[date | None] = mapped_column(
        Date,
        nullable=True,
    )

    status: Mapped[str] = mapped_column(
        String(30),
        default=AdmissionStatus.ADMITTED.value,
        server_default=AdmissionStatus.ADMITTED.value,
        nullable=False,
        index=True,
    )

    reason: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    diagnosis: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    notes: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    discharge_summary: Mapped[str | None] = mapped_column(
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
        back_populates="admissions",
    )

    doctor: Mapped["Doctor"] = relationship(
        "Doctor",
        back_populates="admissions",
    )

    ward: Mapped["Ward | None"] = relationship(
        "Ward",
        back_populates="admissions",
    )

    bed: Mapped["Bed | None"] = relationship(
        "Bed",
        back_populates="admissions",
    )
    
    discharge: Mapped["Discharge | None"] = relationship(
    "Discharge",
    back_populates="admission",
    uselist=False,
    )

    insurance_claims: Mapped[list["InsuranceClaim"]] = relationship(
        "InsuranceClaim",
        back_populates="admission",
    )


    invoices: Mapped[list["Invoice"]] = relationship(
        "Invoice",
        back_populates="admission",
    )

    nursing_care_plans = relationship(
        "NursingCarePlan",
        back_populates="admission",
        cascade="all, delete-orphan",
    )
