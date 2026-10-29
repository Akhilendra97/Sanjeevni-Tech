from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class NursingCarePlanBase(BaseModel):
    care_plan_number: str = Field(..., min_length=1, max_length=100)
    patient_id: int
    admission_id: int | None = None
    nurse_id: int | None = None

    assessment: str | None = None
    nursing_diagnosis: str = Field(..., min_length=1)
    goals: str | None = None
    interventions: str | None = None
    expected_outcome: str | None = None
    evaluation: str | None = None

    priority: str = Field(default="medium", max_length=30)
    status: str = Field(default="active", max_length=30)

    start_date: datetime
    review_date: datetime | None = None
    completed_at: datetime | None = None

    notes: str | None = None


class NursingCarePlanCreate(NursingCarePlanBase):
    pass


class NursingCarePlanUpdate(BaseModel):
    care_plan_number: str | None = Field(
        default=None,
        min_length=1,
        max_length=100,
    )
    patient_id: int | None = None
    admission_id: int | None = None
    nurse_id: int | None = None

    assessment: str | None = None
    nursing_diagnosis: str | None = Field(
        default=None,
        min_length=1,
    )
    goals: str | None = None
    interventions: str | None = None
    expected_outcome: str | None = None
    evaluation: str | None = None

    priority: str | None = Field(
        default=None,
        max_length=30,
    )
    status: str | None = Field(
        default=None,
        max_length=30,
    )

    start_date: datetime | None = None
    review_date: datetime | None = None
    completed_at: datetime | None = None

    notes: str | None = None


class NursingCarePlanResponse(NursingCarePlanBase):
    nurse_name: str | None = None
    nurse_username: str | None = None
    nurse_employee_id: str | None = None
    nurse_department_name: str | None = None

    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    updated_at: datetime
