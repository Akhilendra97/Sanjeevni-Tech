from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class DepartmentCreate(BaseModel):
    name: str = Field(
        ...,
        min_length=2,
        max_length=100,
    )

    code: str = Field(
        ...,
        min_length=2,
        max_length=20,
    )

    description: str | None = None

    location: str | None = Field(
        default=None,
        max_length=255,
    )

    contact_number: str | None = Field(
        default=None,
        max_length=20,
    )


class DepartmentUpdate(BaseModel):
    name: str | None = Field(
        default=None,
        min_length=2,
        max_length=100,
    )

    code: str | None = Field(
        default=None,
        min_length=2,
        max_length=20,
    )

    description: str | None = None

    location: str | None = Field(
        default=None,
        max_length=255,
    )

    contact_number: str | None = Field(
        default=None,
        max_length=20,
    )

    is_active: bool | None = None


class DepartmentResponse(BaseModel):
    id: int
    name: str
    code: str
    description: str | None
    location: str | None
    contact_number: str | None
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(
        from_attributes=True,
    )