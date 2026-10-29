from datetime import date

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class RegisterRequest(BaseModel):
    username: str = Field(
        ...,
        min_length=3,
        max_length=100,
    )

    email: EmailStr

    password: str = Field(
        ...,
        min_length=8,
        max_length=128,
    )

    full_name: str = Field(
        ...,
        min_length=2,
        max_length=150,
    )

    phone: str | None = Field(
        default=None,
        max_length=20,
    )

    role: str = Field(
        default="patient",
        min_length=3,
        max_length=50,
    )

    date_of_birth: date | None = None

    gender: str | None = Field(
        default=None,
        max_length=30,
    )

    blood_group: str | None = Field(
        default=None,
        max_length=5,
    )

    address: str | None = None

    city: str | None = Field(
        default=None,
        max_length=100,
    )

    state: str | None = Field(
        default=None,
        max_length=100,
    )

    postal_code: str | None = Field(
        default=None,
        max_length=20,
    )

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


class LoginRequest(BaseModel):
    username_or_email: str = Field(
        ...,
        min_length=3,
        max_length=255,
    )

    password: str = Field(
        ...,
        min_length=8,
        max_length=128,
    )


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserResponse(BaseModel):
    id: int
    username: str
    email: EmailStr
    full_name: str
    phone: str | None
    role: str
    status: str
    is_verified: bool
    is_superuser: bool

    model_config = ConfigDict(
        from_attributes=True,
    )
