from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class ImagingReportBase(BaseModel):
    report_number: str = Field(
        ...,
        min_length=1,
        max_length=50,
    )
    study_id: int
    report_status: str = Field(
        default="draft",
        max_length=30,
    )
    findings: str | None = None
    impression: str | None = None
    recommendations: str | None = None
    radiologist_name: str | None = Field(
        default=None,
        max_length=150,
    )
    reported_at: datetime | None = None
    is_final: bool = False
    notes: str | None = None


class ImagingReportCreate(ImagingReportBase):
    pass


class ImagingReportUpdate(BaseModel):
    report_number: str | None = Field(
        default=None,
        min_length=1,
        max_length=50,
    )
    study_id: int | None = None
    report_status: str | None = Field(
        default=None,
        max_length=30,
    )
    findings: str | None = None
    impression: str | None = None
    recommendations: str | None = None
    radiologist_name: str | None = Field(
        default=None,
        max_length=150,
    )
    reported_at: datetime | None = None
    is_final: bool | None = None
    notes: str | None = None


class ImagingReportResponse(ImagingReportBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
