from datetime import datetime

from sqlalchemy import (
    Boolean,
    DateTime,
    Integer,
    String,
    Text,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Department(Base):
    __tablename__ = "departments"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        autoincrement=True,
    )

    name: Mapped[str] = mapped_column(
        String(100),
        unique=True,
        nullable=False,
        index=True,
    )

    code: Mapped[str] = mapped_column(
        String(20),
        unique=True,
        nullable=False,
        index=True,
    )

    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    location: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )

    contact_number: Mapped[str | None] = mapped_column(
        String(20),
        nullable=True,
    )

    is_active: Mapped[bool] = mapped_column(
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

    doctors: Mapped[list["Doctor"]] = relationship(
        "Doctor",
        back_populates="department",
    )

    nurses: Mapped[list["Nurse"]] = relationship(
        "Nurse",
        back_populates="department",
    )

    staff_members: Mapped[list["Staff"]] = relationship(
        "Staff",
        back_populates="department",
    )

    operation_theatres: Mapped[list["OperationTheatre"]] = relationship(
        "OperationTheatre",
        back_populates="department",
        cascade="all, delete-orphan",
    )

    surgeries: Mapped[list["Surgery"]] = relationship(
        "Surgery",
        back_populates="department",
        cascade="all, delete-orphan",
    )


    queue_entries = relationship(
        "Queue",
        back_populates="department",
        cascade="all, delete-orphan",
    )

Department.pharmacies = relationship(
    "Pharmacy",
    back_populates="department",
    cascade="all, delete-orphan",
)
