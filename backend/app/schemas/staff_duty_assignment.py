from datetime import date, datetime, time
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, model_validator


class StaffDutyAssignmentResponse(BaseModel):
    id: int
    staff_id: int
    employee_id: str
    full_name: str
    designation: str
    department_name: str | None = None
    duty_date: date
    shift: str
    start_time: time
    end_time: time
    status: str
    notes: str | None = None
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


class AssignWeekRequest(BaseModel):
    start_date: date
    days: int = Field(default=7, ge=1, le=31)


class UpdateStaffDutyRequest(BaseModel):
    duty_date: date
    shift: Literal["morning", "evening", "night"]
    start_time: time
    end_time: time
    status: Literal["scheduled", "completed", "cancelled", "on_leave"] = "scheduled"
    notes: str | None = Field(default=None, max_length=500)

    @model_validator(mode="after")
    def validate_shift_times(self):
        # Night shifts intentionally end the following day; equality is never useful.
        if self.start_time == self.end_time:
            raise ValueError("Duty start and end times must be different.")
        return self
