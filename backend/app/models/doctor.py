from __future__ import annotations

from datetime import date, datetime
from typing import TYPE_CHECKING

from sqlalchemy import (
    Boolean,
    Date,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.doctor_schedule import DoctorSchedule
from app.models.medical_record import MedicalRecord
from app.models.prescription import Prescription
from app.models.admission import Admission
if TYPE_CHECKING:
    from app.models.appointment import Appointment
    from app.models.admission import Admission
    from app.models.department import Department
    from app.models.user import User
    from app.models.diagnosis import Diagnosis
    from app.models.discharge import Discharge
    from app.models.radiology import Radiology
    from app.models.operation_theatre import OperationTheatre
    from app.models.surgery import Surgery
    


class Doctor(Base):
    __tablename__ = "doctors"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        autoincrement=True,
    )

    user_id: Mapped[int] = mapped_column(
        ForeignKey(
            "users.id",
            ondelete="CASCADE",
        ),
        unique=True,
        nullable=False,
        index=True,
    )

    department_id: Mapped[int] = mapped_column(
        ForeignKey(
            "departments.id",
            ondelete="RESTRICT",
        ),
        nullable=False,
        index=True,
    )

    employee_id: Mapped[str] = mapped_column(
        String(50),
        unique=True,
        nullable=False,
        index=True,
    )

    registration_number: Mapped[str] = mapped_column(
        String(100),
        unique=True,
        nullable=False,
        index=True,
    )

    specialization: Mapped[str] = mapped_column(
        String(150),
        nullable=False,
    )

    qualification: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    experience_years: Mapped[int] = mapped_column(
        Integer,
        default=0,
        server_default="0",
        nullable=False,
    )

    consultation_fee: Mapped[float] = mapped_column(
        default=0.0,
        nullable=False,
    )

    joining_date: Mapped[date | None] = mapped_column(
        Date,
        nullable=True,
    )

    bio: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    is_available: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        server_default="true",
        nullable=False,
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

    user: Mapped["User"] = relationship(
        "User",
        back_populates="doctor_profile",
    )

    @property
    def full_name(self) -> str:
        return self.user.full_name

    department: Mapped["Department"] = relationship(
        "Department",
        back_populates="doctors",
    )

    appointments: Mapped[list["Appointment"]] = relationship(
        "Appointment",
        back_populates="doctor",
    )
    
    admissions: Mapped[list["Admission"]] = relationship(
    "Admission",
    back_populates="doctor",
    )

    schedules: Mapped[list["DoctorSchedule"]] = relationship(
        "DoctorSchedule",
        back_populates="doctor",
        cascade="all, delete-orphan",
    )

    medical_records: Mapped[list["MedicalRecord"]] = relationship(
        "MedicalRecord",
        back_populates="doctor",
        cascade="all, delete-orphan",
    )

    prescriptions: Mapped[list["Prescription"]] = relationship(
        "Prescription",
        back_populates="doctor",
        cascade="all, delete-orphan",
    )
    
    diagnoses: Mapped[list["Diagnosis"]] = relationship(
    "Diagnosis",
    back_populates="doctor",
    cascade="all, delete-orphan",
    )
    
    admissions: Mapped[list["Admission"]] = relationship(
    "Admission",
    back_populates="doctor",
    )
    
    discharges: Mapped[list["Discharge"]] = relationship(
    "Discharge",
    back_populates="doctor",
    )
    
    radiology_orders: Mapped[list["Radiology"]] = relationship(
        "Radiology",
        back_populates="doctor",
        cascade="all, delete-orphan",
    )


    operation_theatres_as_surgeon: Mapped[list["OperationTheatre"]] = relationship(
        "OperationTheatre",
        foreign_keys="OperationTheatre.surgeon_id",
        back_populates="surgeon",
    )

    operation_theatres_as_anaesthetist: Mapped[list["OperationTheatre"]] = relationship(
        "OperationTheatre",
        foreign_keys="OperationTheatre.anaesthetist_id",
        back_populates="anaesthetist",
    )

    surgeries_as_surgeon: Mapped[list["Surgery"]] = relationship(
        "Surgery",
        foreign_keys="Surgery.surgeon_id",
        back_populates="surgeon",
    )

    surgeries_as_anaesthetist: Mapped[list["Surgery"]] = relationship(
        "Surgery",
        foreign_keys="Surgery.anaesthetist_id",
        back_populates="anaesthetist",
    )


    queue_entries = relationship(
        "Queue",
        back_populates="doctor",
        cascade="all, delete-orphan",
    )


