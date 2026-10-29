from pydantic import BaseModel, ConfigDict, EmailStr, Field


class HospitalSettingBase(BaseModel):
    hospital_name: str = Field(
        default="Sanjeevni Tech",
        min_length=2,
        max_length=200,
    )

    hospital_code: str | None = Field(
        default=None,
        max_length=50,
    )

    registration_number: str | None = Field(
        default=None,
        max_length=100,
    )

    phone: str | None = Field(
        default=None,
        max_length=30,
    )

    email: EmailStr | None = None

    website: str | None = Field(
        default=None,
        max_length=255,
    )

    address: str | None = None
    city: str | None = Field(default=None, max_length=100)
    state: str | None = Field(default=None, max_length=100)
    postal_code: str | None = Field(default=None, max_length=20)
    country: str = Field(default="India", max_length=100)

    timezone: str = Field(
        default="Asia/Kolkata",
        max_length=100,
    )

    currency: str = Field(
        default="INR",
        max_length=10,
    )

    date_format: str = Field(
        default="DD-MM-YYYY",
        max_length=30,
    )

    appointment_duration: int = Field(
        default=30,
        ge=5,
        le=240,
    )

    working_hours_start: str = Field(
        default="09:00",
        max_length=10,
    )

    working_hours_end: str = Field(
        default="18:00",
        max_length=10,
    )

    emergency_available: bool = True

    patient_id_prefix: str = Field(
        default="PAT",
        min_length=1,
        max_length=20,
    )

    invoice_prefix: str = Field(
        default="INV",
        min_length=1,
        max_length=20,
    )

    prescription_prefix: str = Field(
        default="RX",
        min_length=1,
        max_length=20,
    )

    email_notifications: bool = True
    appointment_reminders: bool = True
    admission_notifications: bool = True
    discharge_notifications: bool = True
    billing_notifications: bool = True

    session_timeout_minutes: int = Field(
        default=30,
        ge=5,
        le=1440,
    )

    password_expiry_days: int = Field(
        default=90,
        ge=0,
        le=3650,
    )

    login_attempt_limit: int = Field(
        default=5,
        ge=1,
        le=20,
    )

    two_factor_enabled: bool = False

    logo_url: str | None = Field(
        default=None,
        max_length=500,
    )

    report_header: str | None = None
    report_footer: str | None = None


class HospitalSettingUpdate(HospitalSettingBase):
    pass


class HospitalSettingResponse(HospitalSettingBase):
    id: int

    model_config = ConfigDict(
        from_attributes=True,
    )
