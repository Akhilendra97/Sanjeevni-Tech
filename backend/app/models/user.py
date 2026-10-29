from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import (
    Boolean,
    DateTime,
    ForeignKey,
    Integer,
    String,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.constants import AccountStatus
from app.core.database import Base
from app.models.patient import Patient

if TYPE_CHECKING:
    from .notification import Notification
    from .leave import Leave
    from .payment import Payment
    from app.models.audit_log import AuditLog
    from app.models.doctor import Doctor
    from app.models.nurse import Nurse
    from app.models.role import Role
    from app.models.staff import Staff


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        autoincrement=True,
    )

    username: Mapped[str] = mapped_column(
        String(100),
        unique=True,
        nullable=False,
        index=True,
    )

    email: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        nullable=False,
        index=True,
    )

    password_hash: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    full_name: Mapped[str] = mapped_column(
        String(150),
        nullable=False,
    )

    phone: Mapped[str | None] = mapped_column(
        String(20),
        unique=True,
        nullable=True,
        index=True,
    )

    role_id: Mapped[int] = mapped_column(
        ForeignKey(
            "roles.id",
            ondelete="RESTRICT",
        ),
        nullable=False,
        index=True,
    )

    status: Mapped[str] = mapped_column(
        String(30),
        default=AccountStatus.ACTIVE.value,
        server_default=AccountStatus.ACTIVE.value,
        nullable=False,
        index=True,
    )

    is_verified: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        server_default="false",
        nullable=False,
    )

    is_superuser: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        server_default="false",
        nullable=False,
    )

    last_login_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
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

    role: Mapped["Role"] = relationship(
        "Role",
        back_populates="users",
    )

    doctor_profile: Mapped["Doctor | None"] = relationship(
        "Doctor",
        back_populates="user",
        uselist=False,
    )

    nurse_profile: Mapped["Nurse | None"] = relationship(
        "Nurse",
        back_populates="user",
        uselist=False,
    )

    staff_profile: Mapped["Staff | None"] = relationship(
        "Staff",
        back_populates="user",
        uselist=False,
    )

    patient_profile: Mapped["Patient | None"] = relationship(
        "Patient",
        back_populates="user",
        uselist=False,
    )
    
    audit_logs: Mapped[list["AuditLog"]] = relationship(
    "AuditLog",
    back_populates="user",
    )

    received_payments: Mapped[list["Payment"]] = relationship(
        "Payment",
        back_populates="received_by_user",
    )


    leave_requests: Mapped[list["Leave"]] = relationship(
        "Leave",
        foreign_keys="Leave.employee_id",
        back_populates="employee",
    )


    approved_leaves: Mapped[list["Leave"]] = relationship(
        "Leave",
        foreign_keys="Leave.approved_by",
        back_populates="approver",
    )


    notifications: Mapped[list["Notification"]] = relationship(
        "Notification",
        back_populates="user",
        cascade="all, delete-orphan",
    )

    triage_assessments = relationship(
        "Triage",
        back_populates="assessed_by_user",
        foreign_keys="Triage.assessed_by",
        cascade="all, delete-orphan",
    )

User.managed_pharmacies = relationship(
    "Pharmacy",
    back_populates="managed_by_user",
    foreign_keys="Pharmacy.managed_by",
    cascade="all, delete-orphan",
)
