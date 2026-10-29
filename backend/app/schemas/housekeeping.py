from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class HousekeepingBase(BaseModel):
    task_number: str = Field(..., min_length=1, max_length=50)
    ward_id: int
    bed_id: int | None = None
    assigned_to: int | None = None
    task_type: str = Field(..., min_length=1, max_length=100)
    priority: str = Field(default="normal", min_length=1, max_length=30)
    status: str = Field(default="pending", min_length=1, max_length=30)
    scheduled_at: datetime | None = None
    started_at: datetime | None = None
    completed_at: datetime | None = None
    description: str | None = None
    notes: str | None = None


class HousekeepingCreate(HousekeepingBase):
    pass


class HousekeepingUpdate(BaseModel):
    ward_id: int | None = None
    bed_id: int | None = None
    assigned_to: int | None = None
    task_type: str | None = Field(
        default=None,
        min_length=1,
        max_length=100,
    )
    priority: str | None = Field(
        default=None,
        min_length=1,
        max_length=30,
    )
    status: str | None = Field(
        default=None,
        min_length=1,
        max_length=30,
    )
    scheduled_at: datetime | None = None
    started_at: datetime | None = None
    completed_at: datetime | None = None
    description: str | None = None
    notes: str | None = None


class HousekeepingResponse(HousekeepingBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    updated_at: datetime
