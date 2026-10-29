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

from app.core.constants import BloodGroup, Gender
from app.core.database import Base

if TYPE_CHECKING:
    from .payment import Payment
    from .invoice import Invoice
    from .insurance_claim import InsuranceClaim
    from .insurance import Insurance
    from app.models.user import User
    from app.models.appointment import Appointment
    from app.models.admission import Admission
    from app.models.medical_record import MedicalRecord
    from app.models.prescription import Prescription
    from app.models.nursing import NursingNote
    from app.models.vital import Vital
    from app.models.billing import Billing
    from app.models.blood_request import BloodRequest
    from app.models.diagnosis import Diagnosis
    from app.models.discharge import Discharge
    from app.models.diet import Diet
    from app.models.document import Document
    from app.models.emergency import Emergency
    from app.models.radiology import Radiology
    from app.models.operation_theatre import OperationTheatre
    from app.models.surgery import Surgery


class Patient(Base):
    __tablename__ = "patients"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        autoincrement=True,
    )

    user_id: Mapped[int | None] = mapped_column(
        ForeignKey(
            "users.id",
            ondelete="SET NULL",
        ),
        unique=True,
        nullable=True,
        index=True,
    )

    patient_number: Mapped[str] = mapped_column(
        String(50),
        unique=True,
        nullable=False,
        index=True,
    )

    first_name: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )

    middle_name: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
    )

    last_name: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )

    date_of_birth: Mapped[date] = mapped_column(
        Date,
        nullable=False,
    )

    gender: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
        index=True,
    )

    blood_group: Mapped[str | None] = mapped_column(
        String(5),
        nullable=True,
        index=True,
    )

    phone: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        index=True,
    )

    alternate_phone: Mapped[str | None] = mapped_column(
        String(20),
        nullable=True,
    )

    email: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
        index=True,
    )

    address: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    city: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
    )

    state: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
    )

    postal_code: Mapped[str | None] = mapped_column(
        String(20),
        nullable=True,
    )

    country: Mapped[str] = mapped_column(
        String(100),
        default="India",
        server_default="India",
        nullable=False,
    )

    emergency_contact_name: Mapped[str | None] = mapped_column(
        String(150),
        nullable=True,
    )

    emergency_contact_phone: Mapped[str | None] = mapped_column(
        String(20),
        nullable=True,
    )

    emergency_contact_relation: Mapped[str | None] = mapped_column(
        String(50),
        nullable=True,
    )

    occupation: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
    )

    nationality: Mapped[str | None] = mapped_column(
        String(100),
        default="Indian",
        server_default="Indian",
        nullable=True,
    )

    allergies: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    chronic_conditions: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        server_default="true",
        nullable=False,
        index=True,
    )

    registration_date: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
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

    @property
    def display_name(self) -> str:
        parts = [self.first_name, self.middle_name, self.last_name]
        return " ".join(part.strip() for part in parts if part and part.strip())

    user: Mapped["User | None"] = relationship(
        "User",
        back_populates="patient_profile",
    )

    admissions: Mapped[list["Admission"]] = relationship(
        "Admission",
        back_populates="patient",
    )

    appointments: Mapped[list["Appointment"]] = relationship(
        "Appointment",
        back_populates="patient",
    )

    medical_records: Mapped[list["MedicalRecord"]] = relationship(
        "MedicalRecord",
        back_populates="patient",
        cascade="all, delete-orphan",
    )

    prescriptions: Mapped[list["Prescription"]] = relationship(
        "Prescription",
        back_populates="patient",
        cascade="all, delete-orphan",
    )

    nursing_notes: Mapped[list["NursingNote"]] = relationship(
        "NursingNote",
        back_populates="patient",
        cascade="all, delete-orphan",
    )

    vitals: Mapped[list["Vital"]] = relationship(
        "Vital",
        back_populates="patient",
        cascade="all, delete-orphan",
    )
    
    billings: Mapped[list["Billing"]] = relationship(
    "Billing",
    back_populates="patient",
    cascade="all, delete-orphan",
    )
    blood_requests: Mapped[list["BloodRequest"]] = relationship(
    "BloodRequest",
    back_populates="patient",
    cascade="all, delete-orphan",
    )
    
    diagnoses: Mapped[list["Diagnosis"]] = relationship(
    "Diagnosis",
    back_populates="patient",
    cascade="all, delete-orphan",
    )
    
    discharges: Mapped[list["Discharge"]] = relationship(
    "Discharge",
    back_populates="patient",
    )

    @property
    def full_name(self) -> str:
        parts = [
            self.first_name,
            self.middle_name,
            self.last_name,
        ]

        return " ".join(
            part.strip()
            for part in parts
            if part and part.strip()
        )

    diets: Mapped[list["Diet"]] = relationship(
        "Diet",
        back_populates="patient",
        cascade="all, delete-orphan",
    )

    documents: Mapped[list["Document"]] = relationship(
        "Document",
        back_populates="patient",
        cascade="all, delete-orphan",
    )

    emergencies: Mapped[list["Emergency"]] = relationship(
        "Emergency",
        back_populates="patient",
        cascade="all, delete-orphan",
    )



    insurance_claims: Mapped[list["InsuranceClaim"]] = relationship(
        "InsuranceClaim",
        back_populates="patient",
        cascade="all, delete-orphan",
    )



    payments: Mapped[list["Payment"]] = relationship(
        "Payment",
        back_populates="patient",
        cascade="all, delete-orphan",
    )

    invoices: Mapped[list["Invoice"]] = relationship(
        "Invoice",
        back_populates="patient",
        cascade="all, delete-orphan",
    )

    insurance_policies: Mapped[list["Insurance"]] = relationship(
        "Insurance",
        back_populates="patient",
        cascade="all, delete-orphan",
    )

    radiology_records: Mapped[list["Radiology"]] = relationship(
        "Radiology",
        back_populates="patient",
        cascade="all, delete-orphan",
    )


    operation_theatres: Mapped[list["OperationTheatre"]] = relationship(
        "OperationTheatre",
        back_populates="patient",
        cascade="all, delete-orphan",
    )

    surgeries: Mapped[list["Surgery"]] = relationship(
        "Surgery",
        back_populates="patient",
        cascade="all, delete-orphan",
    )


    triage_records = relationship(
        "Triage",
        back_populates="patient",
        cascade="all, delete-orphan",
    )

    queue_entries = relationship(
        "Queue",
        back_populates="patient",
        cascade="all, delete-orphan",
    )

Patient.parking_records = relationship(
    "Parking",
    back_populates="patient",
    cascade="all, delete-orphan",
)

Patient.visitors = relationship(
    "Visitor",
    back_populates="patient",
    cascade="all, delete-orphan",
)

Patient.nursing_care_plans = relationship(
    "NursingCarePlan",
    back_populates="patient",
    cascade="all, delete-orphan",
)
