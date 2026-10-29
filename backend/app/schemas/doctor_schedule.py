from datetime import time

from pydantic import BaseModel, ConfigDict, Field


class DoctorScheduleCreate(BaseModel):
    doctor_id: int = Field(..., gt=0)

    day_of_week: str = Field(
        ...,
        min_length=3,
        max_length=20,
    )

    start_time: time

    end_time: time

    slot_duration_minutes: int = Field(
        default=30,
        ge=5,
        le=240,
    )

    is_available: bool = True

    notes: str | None = Field(
        default=None,
        max_length=500,
    )


class DoctorScheduleUpdate(BaseModel):
    day_of_week: str | None = Field(
        default=None,
        min_length=3,
        max_length=20,
    )

    start_time: time | None = None

    end_time: time | None = None

    slot_duration_minutes: int | None = Field(
        default=None,
        ge=5,
        le=240,
    )

    is_available: bool | None = None

    notes: str | None = Field(
        default=None,
        max_length=500,
    )


class DoctorScheduleResponse(BaseModel):
    id: int
    doctor_id: int
    day_of_week: str
    start_time: time
    end_time: time
    slot_duration_minutes: int
    is_available: bool
    notes: str | None

    model_config = ConfigDict(
        from_attributes=True,
    )