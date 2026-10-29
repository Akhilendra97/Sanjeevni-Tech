from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class LabSampleBase(BaseModel):
    sample_number: str = Field(
        ...,
        min_length=2,
        max_length=50,
    )

    patient_id: int = Field(..., gt=0)

    lab_test_id: int = Field(..., gt=0)

    collected_at: datetime | None = None

    received_at: datetime | None = None

    status: str = Field(
        default="collected",
        min_length=2,
        max_length=50,
    )

    notes: str | None = None


class LabSampleCreate(LabSampleBase):
    pass


class LabSampleUpdate(BaseModel):
    sample_number: str | None = Field(
        default=None,
        min_length=2,
        max_length=50,
    )

    patient_id: int | None = Field(
        default=None,
        gt=0,
    )

    lab_test_id: int | None = Field(
        default=None,
        gt=0,
    )

    collected_at: datetime | None = None

    received_at: datetime | None = None

    status: str | None = Field(
        default=None,
        min_length=2,
        max_length=50,
    )

    notes: str | None = None


class LabSampleResponse(LabSampleBase):
    id: int
    patient_name: str | None = None
    patient_number: str | None = None
    test_name: str | None = None
    test_code: str | None = None
    test_category: str | None = None
    sample_type: str | None = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
