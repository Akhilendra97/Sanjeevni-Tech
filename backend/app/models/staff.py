from datetime import date, datetime
from typing import TYPE_CHECKING

from sqlalchemy import (
    Boolean,
    Date,
    DateTime,
    ForeignKey,
    Integer,
    String,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.department import Department
    from app.models.user import User
    from app.models.housekeeping import Housekeeping
    from app.models.operation_theatre import OperationTheatre


class Staff(Base):
    __tablename__ = "staff"

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

    designation: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )

    qualification: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )

    joining_date: Mapped[date | None] = mapped_column(
        Date,
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
        back_populates="staff_profile",
    )

    department: Mapped["Department"] = relationship(
        "Department",
        back_populates="staff_members",
    )


    @property
    def full_name(self) -> str | None:
        return self.user.full_name if self.user else None

    @property
    def username(self) -> str | None:
        return self.user.username if self.user else None

    @property
    def email(self) -> str | None:
        return self.user.email if self.user else None

    @property
    def phone(self) -> str | None:
        return self.user.phone if self.user else None

    @property
    def department_name(self) -> str | None:
        return self.department.name if self.department else None

    housekeeping_tasks: Mapped[list["Housekeeping"]] = relationship(
        "Housekeeping",
        foreign_keys="Housekeeping.assigned_to",
        back_populates="assigned_staff",
    )


    operation_theatres: Mapped[list["OperationTheatre"]] = relationship(
        "OperationTheatre",
        foreign_keys="OperationTheatre.assigned_staff_id",
        back_populates="assigned_staff",
    )

Staff.parking_records = relationship(
    "Parking",
    back_populates="staff",
    cascade="all, delete-orphan",
)
