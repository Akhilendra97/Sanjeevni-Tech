from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field


class DoctorCreate(BaseModel):
    user_id: int = Field(..., gt=0)
    department_id: int = Field(..., gt=0)

    employee_id: str = Field(
        ...,
        min_length=2,
        max_length=50,
    )

    registration_number: str = Field(
        ...,
        min_length=2,
        max_length=100,
    )

    specialization: str = Field(
        ...,
        min_length=2,
        max_length=150,
    )

    qualification: str = Field(
        ...,
        min_length=2,
        max_length=255,
    )

    experience_years: int = Field(
        default=0,
        ge=0,
    )

    consultation_fee: float = Field(
        default=0.0,
        ge=0,
    )

    joining_date: date | None = None

    bio: str | None = None

    is_available: bool = True


class DoctorUpdate(BaseModel):
    # Explicitly accept the linked User name so Pydantic does not silently discard it.
    full_name: str | None = Field(default=None, min_length=2, max_length=255)

    department_id: int | None = Field(
        default=None,
        gt=0,
    )

    specialization: str | None = Field(
        default=None,
        min_length=2,
        max_length=150,
    )

    qualification: str | None = Field(
        default=None,
        min_length=2,
        max_length=255,
    )

    experience_years: int | None = Field(
        default=None,
        ge=0,
    )

    consultation_fee: float | None = Field(
        default=None,
        ge=0,
    )

    joining_date: date | None = None

    bio: str | None = None

    is_available: bool | None = None


class DoctorResponse(BaseModel):
    full_name: str
    id: int
    user_id: int
    department_id: int
    employee_id: str
    registration_number: str
    specialization: str
    qualification: str
    experience_years: int
    consultation_fee: float
    joining_date: date | None
    bio: str | None
    is_available: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(
        from_attributes=True,
    )


