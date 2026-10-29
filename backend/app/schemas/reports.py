from datetime import date, datetime
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field


ReportType = Literal[
    "overview",
    "patient",
    "financial",
    "operational",
    "clinical",
]


class ReportRequest(BaseModel):
    report_type: ReportType

    start_date: date | None = None

    end_date: date | None = None

    patient_id: int | None = Field(
        default=None,
        gt=0,
    )


class ReportResponse(BaseModel):
    report_type: ReportType

    title: str

    generated_at: datetime

    data: dict[str, Any]

    model_config = ConfigDict(
        from_attributes=True,
    )


class ReportFileResponse(BaseModel):
    report_type: ReportType

    file_name: str

    file_path: str

    generated_at: datetime

    format: str = "pdf"
