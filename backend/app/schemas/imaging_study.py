from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class ImagingStudyBase(BaseModel):
    study_number: str = Field(
        ...,
        min_length=1,
        max_length=50,
    )
    radiology_id: int
    modality: str = Field(
        ...,
        min_length=1,
        max_length=50,
    )
    study_description: str | None = None
    body_part: str = Field(
        ...,
        min_length=1,
        max_length=100,
    )
    study_date: datetime
    completion_date: datetime | None = None
    performed_by: str | None = Field(
        default=None,
        max_length=150,
    )
    equipment_name: str | None = Field(
        default=None,
        max_length=150,
    )
    image_count: int = Field(
        default=0,
        ge=0,
    )
    image_storage_path: str | None = Field(
        default=None,
        max_length=500,
    )
    is_completed: bool = False
    notes: str | None = None


class ImagingStudyCreate(ImagingStudyBase):
    pass


class ImagingStudyUpdate(BaseModel):
    study_number: str | None = Field(
        default=None,
        min_length=1,
        max_length=50,
    )
    radiology_id: int | None = None
    modality: str | None = Field(
        default=None,
        min_length=1,
        max_length=50,
    )
    study_description: str | None = None
    body_part: str | None = Field(
        default=None,
        min_length=1,
        max_length=100,
    )
    study_date: datetime | None = None
    completion_date: datetime | None = None
    performed_by: str | None = Field(
        default=None,
        max_length=150,
    )
    equipment_name: str | None = Field(
        default=None,
        max_length=150,
    )
    image_count: int | None = Field(
        default=None,
        ge=0,
    )
    image_storage_path: str | None = Field(
        default=None,
        max_length=500,
    )
    is_completed: bool | None = None
    notes: str | None = None


class ImagingStudyResponse(ImagingStudyBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
