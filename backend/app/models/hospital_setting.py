from datetime import datetime

from sqlalchemy import Boolean, DateTime, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class HospitalSetting(Base):
    __tablename__ = "hospital_settings"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        autoincrement=True,
    )

    hospital_name: Mapped[str] = mapped_column(
        String(200),
        nullable=False,
        default="Sanjeevni Tech",
    )

    hospital_code: Mapped[str | None] = mapped_column(
        String(50),
        nullable=True,
    )

    registration_number: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
    )

    phone: Mapped[str | None] = mapped_column(
        String(30),
        nullable=True,
    )

    email: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )

    website: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
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
        nullable=False,
        default="India",
    )

    timezone: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        default="Asia/Kolkata",
    )

    currency: Mapped[str] = mapped_column(
        String(10),
        nullable=False,
        default="INR",
    )

    date_format: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
        default="DD-MM-YYYY",
    )

    appointment_duration: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=30,
    )

    working_hours_start: Mapped[str] = mapped_column(
        String(10),
        nullable=False,
        default="09:00",
    )

    working_hours_end: Mapped[str] = mapped_column(
        String(10),
        nullable=False,
        default="18:00",
    )

    emergency_available: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
        server_default="true",
    )

    patient_id_prefix: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default="PAT",
    )

    invoice_prefix: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default="INV",
    )

    prescription_prefix: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default="RX",
    )

    email_notifications: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
        server_default="true",
    )

    appointment_reminders: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
        server_default="true",
    )

    admission_notifications: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
        server_default="true",
    )

    discharge_notifications: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
        server_default="true",
    )

    billing_notifications: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
        server_default="true",
    )

    session_timeout_minutes: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=30,
    )

    password_expiry_days: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=90,
    )

    login_attempt_limit: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=5,
    )

    two_factor_enabled: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
        server_default="false",
    )

    logo_url: Mapped[str | None] = mapped_column(
        String(500),
        nullable=True,
    )

    report_header: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    report_footer: Mapped[str | None] = mapped_column(
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
