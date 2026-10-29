from datetime import date, datetime

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


class Nurse(Base):
    __tablename__ = "nurses"

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

    nursing_registration_number: Mapped[str] = mapped_column(
        String(100),
        unique=True,
        nullable=False,
        index=True,
    )

    qualification: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
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
        back_populates="nurse_profile",
    )

    department: Mapped["Department"] = relationship(
        "Department",
        back_populates="nurses",
    )

    nursing_notes: Mapped[list["NursingNote"]] = relationship(
        "NursingNote",
        back_populates="nurse",
    )
    nursing_care_plans = relationship(
        "NursingCarePlan",
        back_populates="nurse",
        cascade="all, delete-orphan",
    )

    @property
    def full_name(self) -> str | None:
        return self.user.full_name if self.user is not None else None

    @property
    def username(self) -> str | None:
        return self.user.username if self.user is not None else None

    @property
    def email(self) -> str | None:
        return self.user.email if self.user is not None else None

    @property
    def department_name(self) -> str | None:
        return self.department.name if self.department is not None else None


    @property
    def phone(self) -> str | None:
        return self.user.phone if self.user is not None else None
