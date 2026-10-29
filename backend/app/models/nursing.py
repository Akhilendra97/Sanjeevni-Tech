from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.nurse import Nurse
    from app.models.patient import Patient


class NursingNote(Base):
    __tablename__ = "nursing_notes"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        autoincrement=True,
    )

    nurse_id: Mapped[int] = mapped_column(
        ForeignKey(
            "nurses.id",
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

    note_type: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        default="general",
        server_default="general",
        index=True,
    )

    subject: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )

    note: Mapped[str] = mapped_column(
        Text,
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

    nurse: Mapped["Nurse"] = relationship(
        "Nurse",
        back_populates="nursing_notes",
    )

    patient: Mapped["Patient"] = relationship(
        "Patient",
        back_populates="nursing_notes",
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
