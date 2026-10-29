from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class LabBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=150)
    code: str = Field(..., min_length=2, max_length=50)
    description: str | None = None
    location: str | None = Field(default=None, max_length=255)
    contact_number: str | None = Field(default=None, max_length=20)
    is_active: bool = True


class LabCreate(LabBase):
    pass


class LabUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=150)
    code: str | None = Field(default=None, min_length=2, max_length=50)
    description: str | None = None
    location: str | None = Field(default=None, max_length=255)
    contact_number: str | None = Field(default=None, max_length=20)
    is_active: bool | None = None


class LabResponse(LabBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)