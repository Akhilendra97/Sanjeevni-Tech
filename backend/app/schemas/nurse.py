from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field


class NurseUserSummary(BaseModel):
    id: int
    username: str
    email: str
    full_name: str
    phone: str | None = None
    status: str | None = None

    model_config = ConfigDict(from_attributes=True)


class NurseDepartmentSummary(BaseModel):
    id: int
    name: str

    model_config = ConfigDict(from_attributes=True)


class NurseBase(BaseModel):
    # Optional for compatibility with existing API clients.
    full_name: str | None = Field(default=None, min_length=2, max_length=150)
    user_id: int = Field(..., gt=0)
    department_id: int = Field(..., gt=0)
    employee_id: str = Field(..., min_length=1, max_length=50)
    nursing_registration_number: str = Field(
        ...,
        min_length=1,
        max_length=100,
    )
    qualification: str = Field(..., min_length=2, max_length=255)
    joining_date: date | None = None
    is_available: bool = True


class NurseCreate(NurseBase):
    pass


class NurseUpdate(BaseModel):
    full_name: str | None = Field(default=None, min_length=2, max_length=150)
    user_id: int | None = Field(default=None, gt=0)
    department_id: int | None = Field(default=None, gt=0)
    employee_id: str | None = Field(
        default=None,
        min_length=1,
        max_length=50,
    )
    nursing_registration_number: str | None = Field(
        default=None,
        min_length=1,
        max_length=100,
    )
    qualification: str | None = Field(
        default=None,
        min_length=2,
        max_length=255,
    )
    joining_date: date | None = None
    is_available: bool | None = None


class NurseResponse(NurseBase):
    id: int
    full_name: str | None = None
    username: str | None = None
    email: str | None = None
    phone: str | None = None
    department_name: str | None = None
    user: NurseUserSummary | None = None
    department: NurseDepartmentSummary | None = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
