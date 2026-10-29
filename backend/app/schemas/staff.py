from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field, model_validator


class StaffBase(BaseModel):
    user_id: int | None = Field(default=None, gt=0)
    department_id: int = Field(..., gt=0)
    employee_id: str = Field(..., min_length=1, max_length=50)
    designation: str = Field(..., min_length=2, max_length=100)
    qualification: str | None = Field(default=None, max_length=255)
    joining_date: date | None = None
    is_available: bool = True


class StaffCreate(StaffBase):
    # If user_id is omitted, create a linked staff login account from these fields.
    full_name: str | None = Field(default=None, min_length=2, max_length=150)
    username: str | None = Field(default=None, min_length=3, max_length=100)
    email: EmailStr | None = None
    phone: str | None = Field(default=None, max_length=20)
    password: str | None = Field(default=None, min_length=8, max_length=128)

    @model_validator(mode="after")
    def validate_user_source(self):
        if self.user_id is None:
            missing = [name for name in ("full_name", "username", "email", "password") if not getattr(self, name)]
            if missing:
                raise ValueError("For a new staff login, provide full_name, username, email and password.")
        return self


class StaffUpdate(BaseModel):
    user_id: int | None = Field(default=None, gt=0)
    department_id: int | None = Field(default=None, gt=0)
    employee_id: str | None = Field(default=None, min_length=1, max_length=50)
    designation: str | None = Field(default=None, min_length=2, max_length=100)
    qualification: str | None = Field(default=None, max_length=255)
    joining_date: date | None = None
    is_available: bool | None = None
    full_name: str | None = Field(default=None, min_length=2, max_length=150)
    email: EmailStr | None = None
    phone: str | None = Field(default=None, max_length=20)


class StaffResponse(StaffBase):
    id: int
    full_name: str | None = None
    username: str | None = None
    email: EmailStr | None = None
    phone: str | None = None
    department_name: str | None = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
