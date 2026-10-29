from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field


class LeaveBase(BaseModel):
    leave_number: str = Field(
        ...,
        min_length=1,
        max_length=100,
    )

    employee_id: int

    leave_type: str = Field(
        ...,
        min_length=1,
        max_length=50,
    )

    start_date: date
    end_date: date

    reason: str | None = None

    status: str = Field(
        default="pending",
        min_length=1,
        max_length=30,
    )

    approved_by: int | None = None

    approved_at: datetime | None = None

    remarks: str | None = None


class LeaveCreate(LeaveBase):
    pass


class LeaveUpdate(BaseModel):
    leave_number: str | None = Field(
        default=None,
        min_length=1,
        max_length=100,
    )

    employee_id: int | None = None

    leave_type: str | None = Field(
        default=None,
        min_length=1,
        max_length=50,
    )

    start_date: date | None = None
    end_date: date | None = None

    reason: str | None = None

    status: str | None = Field(
        default=None,
        min_length=1,
        max_length=30,
    )

    approved_by: int | None = None

    approved_at: datetime | None = None

    remarks: str | None = None


class LeaveResponse(LeaveBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    updated_at: datetime
