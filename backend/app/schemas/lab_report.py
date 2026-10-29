from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class LabReportBase(BaseModel):
    sample_id: int = Field(..., gt=0)

    report_number: str = Field(
        ...,
        min_length=2,
        max_length=50,
    )

    result: str = Field(..., min_length=1)

    interpretation: str | None = None

    status: str = Field(
        default="completed",
        min_length=2,
        max_length=50,
    )

    reported_at: datetime | None = None

    remarks: str | None = None


class LabReportCreate(LabReportBase):
    pass


class LabReportUpdate(BaseModel):
    report_number: str | None = Field(
        default=None,
        min_length=2,
        max_length=50,
    )

    result: str | None = Field(
        default=None,
        min_length=1,
    )

    interpretation: str | None = None

    status: str | None = Field(
        default=None,
        min_length=2,
        max_length=50,
    )

    reported_at: datetime | None = None

    remarks: str | None = None


class LabReportResponse(LabReportBase):
    id: int
    sample_number: str | None = None
    patient_id: int | None = None
    patient_name: str | None = None
    patient_number: str | None = None
    lab_test_id: int | None = None
    test_name: str | None = None
    test_code: str | None = None
    sample_type: str | None = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)