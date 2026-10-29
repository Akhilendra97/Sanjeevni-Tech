from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class NursingNoteBase(BaseModel):
    nurse_id: int = Field(..., gt=0)
    patient_id: int = Field(..., gt=0)

    note_type: str = Field(
        default="general",
        min_length=1,
        max_length=50,
    )

    subject: str | None = Field(
        default=None,
        max_length=255,
    )

    note: str = Field(
        ...,
        min_length=1,
    )


class NursingNoteCreate(NursingNoteBase):
    pass


class NursingNoteUpdate(BaseModel):
    note_type: str | None = Field(
        default=None,
        min_length=1,
        max_length=50,
    )

    subject: str | None = Field(
        default=None,
        max_length=255,
    )

    note: str | None = Field(
        default=None,
        min_length=1,
    )


class NursingNoteResponse(NursingNoteBase):
    id: int
    nurse_name: str | None = None
    nurse_username: str | None = None
    nurse_employee_id: str | None = None
    nurse_department_name: str | None = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(
        from_attributes=True,
    )