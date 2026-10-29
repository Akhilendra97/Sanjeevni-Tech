from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class LabTestBase(BaseModel):
    lab_id: int = Field(..., gt=0)
    test_code: str = Field(..., min_length=2, max_length=50)
    name: str = Field(..., min_length=2, max_length=150)
    category: str = Field(..., min_length=2, max_length=100)
    description: str | None = None
    sample_type: str = Field(..., min_length=2, max_length=100)
    price: float = Field(default=0, ge=0)
    normal_range: str | None = Field(default=None, max_length=255)
    unit: str | None = Field(default=None, max_length=50)
    turnaround_time_hours: int = Field(default=24, gt=0)
    is_active: bool = True


class LabTestCreate(LabTestBase):
    pass


class LabTestUpdate(BaseModel):
    lab_id: int | None = Field(default=None, gt=0)
    test_code: str | None = Field(
        default=None,
        min_length=2,
        max_length=50,
    )
    name: str | None = Field(
        default=None,
        min_length=2,
        max_length=150,
    )
    category: str | None = Field(
        default=None,
        min_length=2,
        max_length=100,
    )
    description: str | None = None
    sample_type: str | None = Field(
        default=None,
        min_length=2,
        max_length=100,
    )
    price: float | None = Field(
        default=None,
        ge=0,
    )
    normal_range: str | None = Field(
        default=None,
        max_length=255,
    )
    unit: str | None = Field(
        default=None,
        max_length=50,
    )
    turnaround_time_hours: int | None = Field(
        default=None,
        gt=0,
    )
    is_active: bool | None = None


class LabTestResponse(LabTestBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)