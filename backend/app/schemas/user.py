from datetime import datetime

import re

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator


class UserCreate(BaseModel):
    username: str = Field(..., min_length=3, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128)
    full_name: str = Field(..., min_length=2, max_length=150)
    phone: str | None = Field(default=None, max_length=20)
    role: str = Field(..., min_length=3, max_length=50)
    status: str = Field(default="active", max_length=30)
    is_verified: bool = False


class UserUpdate(BaseModel):
    # Seed/demo accounts use internal .local addresses. EmailStr can reject these
    # when an administrator saves otherwise unchanged account details.
    email: str | None = Field(default=None, max_length=255)

    @field_validator("email")
    @classmethod
    def validate_update_email(cls, value: str | None) -> str | None:
        if value is None:
            return None
        normalized = value.strip().lower()
        # Accept normal domains and internal .local domains; reject malformed input.
        if not re.fullmatch(r"[^@\s]+@[^@\s]+\.[^@\s]+", normalized):
            raise ValueError("Enter a valid email address.")
        return normalized

    full_name: str | None = Field(default=None, min_length=2, max_length=150)
    phone: str | None = Field(default=None, max_length=20)
    role: str | None = Field(default=None, min_length=3, max_length=50)
    status: str | None = Field(default=None, max_length=30)
    is_verified: bool | None = None


class UserPasswordReset(BaseModel):
    password: str = Field(..., min_length=8, max_length=128)


class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    full_name: str
    phone: str | None
    role: str
    status: str
    is_verified: bool
    is_superuser: bool
    last_login_at: datetime | None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class UserListResponse(BaseModel):
    items: list[UserResponse]
    total: int
    page: int
    page_size: int
    pages: int
