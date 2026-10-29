from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class ICUBase(BaseModel):
    icu_number: str = Field(..., min_length=1, max_length=50)
    admission_id: int
    patient_id: int
    doctor_id: int
    nurse_id: int | None = None
    ward_id: int | None = None
    bed_id: int | None = None
    icu_type: str = Field(..., min_length=1, max_length=50)
    admission_time: datetime
    discharge_time: datetime | None = None
    status: str = Field(default="active", max_length=30)
    diagnosis: str | None = None
    treatment_plan: str | None = None
    ventilator_required: bool = False
    ventilator_start_time: datetime | None = None
    ventilator_end_time: datetime | None = None
    notes: str | None = None


class ICUCreate(ICUBase):
    pass


class ICUUpdate(BaseModel):
    icu_number: str | None = Field(
        default=None,
        min_length=1,
        max_length=50,
    )
    admission_id: int | None = None
    patient_id: int | None = None
    doctor_id: int | None = None
    nurse_id: int | None = None
    ward_id: int | None = None
    bed_id: int | None = None
    icu_type: str | None = Field(
        default=None,
        min_length=1,
        max_length=50,
    )
    admission_time: datetime | None = None
    discharge_time: datetime | None = None
    status: str | None = Field(
        default=None,
        max_length=30,
    )
    diagnosis: str | None = None
    treatment_plan: str | None = None
    ventilator_required: bool | None = None
    ventilator_start_time: datetime | None = None
    ventilator_end_time: datetime | None = None
    notes: str | None = None


class ICUResponse(ICUBase):
    nurse_name: str | None = None
    nurse_username: str | None = None
    nurse_employee_id: str | None = None
    nurse_department_name: str | None = None
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
