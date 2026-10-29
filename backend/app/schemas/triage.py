from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class TriageBase(BaseModel):
    triage_number: str = Field(..., min_length=1, max_length=100)
    emergency_id: int
    patient_id: int
    assessed_by: int | None = None

    triage_level: str = Field(
        default="urgent",
        min_length=1,
        max_length=30,
    )

    priority_score: int = Field(
        default=0,
        ge=0,
    )

    chief_complaint: str | None = None
    symptoms: str | None = None

    pain_score: int | None = Field(
        default=None,
        ge=0,
        le=10,
    )

    consciousness_level: str | None = Field(
        default=None,
        max_length=50,
    )

    temperature: str | None = Field(
        default=None,
        max_length=30,
    )

    heart_rate: int | None = Field(
        default=None,
        ge=0,
    )

    respiratory_rate: int | None = Field(
        default=None,
        ge=0,
    )

    oxygen_saturation: int | None = Field(
        default=None,
        ge=0,
        le=100,
    )

    systolic_bp: int | None = Field(
        default=None,
        ge=0,
    )

    diastolic_bp: int | None = Field(
        default=None,
        ge=0,
    )

    assessment: str | None = None
    immediate_intervention: str | None = None

    recommended_department: str | None = Field(
        default=None,
        max_length=150,
    )

    status: str = Field(
        default="active",
        min_length=1,
        max_length=30,
    )

    assessed_at: datetime
    reassessed_at: datetime | None = None
    notes: str | None = None


class TriageCreate(TriageBase):
    pass


class TriageUpdate(BaseModel):
    assessed_by: int | None = None
    triage_level: str | None = Field(
        default=None,
        min_length=1,
        max_length=30,
    )
    priority_score: int | None = Field(
        default=None,
        ge=0,
    )
    chief_complaint: str | None = None
    symptoms: str | None = None
    pain_score: int | None = Field(
        default=None,
        ge=0,
        le=10,
    )
    consciousness_level: str | None = Field(
        default=None,
        max_length=50,
    )
    temperature: str | None = Field(
        default=None,
        max_length=30,
    )
    heart_rate: int | None = Field(
        default=None,
        ge=0,
    )
    respiratory_rate: int | None = Field(
        default=None,
        ge=0,
    )
    oxygen_saturation: int | None = Field(
        default=None,
        ge=0,
        le=100,
    )
    systolic_bp: int | None = Field(
        default=None,
        ge=0,
    )
    diastolic_bp: int | None = Field(
        default=None,
        ge=0,
    )
    assessment: str | None = None
    immediate_intervention: str | None = None
    recommended_department: str | None = Field(
        default=None,
        max_length=150,
    )
    status: str | None = Field(
        default=None,
        min_length=1,
        max_length=30,
    )
    reassessed_at: datetime | None = None
    notes: str | None = None


class TriageResponse(TriageBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    updated_at: datetime
