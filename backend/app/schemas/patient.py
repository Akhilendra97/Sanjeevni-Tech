from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class PatientCreate(BaseModel):
    patient_number: str = Field(..., min_length=1, max_length=50)

    first_name: str = Field(..., min_length=1, max_length=100)
    middle_name: str | None = Field(default=None, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)

    date_of_birth: date
    gender: str = Field(..., min_length=1, max_length=30)
    blood_group: str | None = Field(default=None, max_length=5)

    phone: str = Field(..., min_length=5, max_length=20)
    alternate_phone: str | None = Field(default=None, max_length=20)

    email: EmailStr | None = None

    address: str | None = None
    city: str | None = Field(default=None, max_length=100)
    state: str | None = Field(default=None, max_length=100)
    postal_code: str | None = Field(default=None, max_length=20)

    country: str = Field(default="India", max_length=100)

    emergency_contact_name: str | None = Field(
        default=None,
        max_length=150,
    )
    emergency_contact_phone: str | None = Field(
        default=None,
        max_length=20,
    )
    emergency_contact_relation: str | None = Field(
        default=None,
        max_length=50,
    )

    occupation: str | None = Field(default=None, max_length=100)
    nationality: str | None = Field(
        default="Indian",
        max_length=100,
    )

    allergies: str | None = None
    chronic_conditions: str | None = None


class PatientUpdate(BaseModel):
    first_name: str | None = Field(default=None, max_length=100)
    middle_name: str | None = Field(default=None, max_length=100)
    last_name: str | None = Field(default=None, max_length=100)

    date_of_birth: date | None = None
    gender: str | None = Field(default=None, max_length=30)
    blood_group: str | None = Field(default=None, max_length=5)

    phone: str | None = Field(default=None, max_length=20)
    alternate_phone: str | None = Field(default=None, max_length=20)

    email: str | None = None

    address: str | None = None
    city: str | None = Field(default=None, max_length=100)
    state: str | None = Field(default=None, max_length=100)
    postal_code: str | None = Field(default=None, max_length=20)

    country: str | None = Field(default=None, max_length=100)

    emergency_contact_name: str | None = Field(
        default=None,
        max_length=150,
    )
    emergency_contact_phone: str | None = Field(
        default=None,
        max_length=20,
    )
    emergency_contact_relation: str | None = Field(
        default=None,
        max_length=50,
    )

    occupation: str | None = Field(default=None, max_length=100)
    nationality: str | None = Field(default=None, max_length=100)

    allergies: str | None = None
    chronic_conditions: str | None = None

    is_active: bool | None = None


class PatientResponse(BaseModel):
    id: int
    user_id: int | None

    patient_number: str

    first_name: str
    middle_name: str | None
    last_name: str

    full_name: str

    date_of_birth: date
    gender: str
    blood_group: str | None

    phone: str
    alternate_phone: str | None
    email: str | None

    address: str | None
    city: str | None
    state: str | None
    postal_code: str | None
    country: str

    emergency_contact_name: str | None
    emergency_contact_phone: str | None
    emergency_contact_relation: str | None

    occupation: str | None
    nationality: str | None

    allergies: str | None
    chronic_conditions: str | None

    is_active: bool

    registration_date: datetime
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(
        from_attributes=True,
    )
