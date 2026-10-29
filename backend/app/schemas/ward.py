from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class WardBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    code: str = Field(..., min_length=2, max_length=30)
    ward_type: str = Field(..., min_length=2, max_length=50)
    floor: str | None = Field(default=None, max_length=50)
    location: str | None = Field(default=None, max_length=255)
    description: str | None = None
    capacity: int = Field(default=0, ge=0)
    is_active: bool = True


class WardCreate(WardBase):
    pass


class WardUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=100)
    code: str | None = Field(default=None, min_length=2, max_length=30)
    ward_type: str | None = Field(default=None, min_length=2, max_length=50)
    floor: str | None = Field(default=None, max_length=50)
    location: str | None = Field(default=None, max_length=255)
    description: str | None = None
    capacity: int | None = Field(default=None, ge=0)
    is_active: bool | None = None


class WardResponse(WardBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)