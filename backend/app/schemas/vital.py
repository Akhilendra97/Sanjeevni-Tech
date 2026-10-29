from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class VitalBase(BaseModel):
    patient_id: int = Field(..., gt=0)

    temperature: float | None = Field(
        default=None,
        ge=20,
        le=50,
    )

    heart_rate: int | None = Field(
        default=None,
        ge=20,
        le=250,
    )

    respiratory_rate: int | None = Field(
        default=None,
        ge=5,
        le=100,
    )

    systolic_bp: int | None = Field(
        default=None,
        ge=50,
        le=300,
    )

    diastolic_bp: int | None = Field(
        default=None,
        ge=30,
        le=200,
    )

    oxygen_saturation: float | None = Field(
        default=None,
        ge=0,
        le=100,
    )

    blood_glucose: float | None = Field(
        default=None,
        ge=0,
        le=1000,
    )

    weight: float | None = Field(
        default=None,
        ge=0,
        le=500,
    )

    height: float | None = Field(
        default=None,
        ge=0,
        le=300,
    )

    notes: str | None = None


class VitalCreate(VitalBase):
    pass


class VitalUpdate(BaseModel):
    temperature: float | None = Field(
        default=None,
        ge=20,
        le=50,
    )

    heart_rate: int | None = Field(
        default=None,
        ge=20,
        le=250,
    )

    respiratory_rate: int | None = Field(
        default=None,
        ge=5,
        le=100,
    )

    systolic_bp: int | None = Field(
        default=None,
        ge=50,
        le=300,
    )

    diastolic_bp: int | None = Field(
        default=None,
        ge=30,
        le=200,
    )

    oxygen_saturation: float | None = Field(
        default=None,
        ge=0,
        le=100,
    )

    blood_glucose: float | None = Field(
        default=None,
        ge=0,
        le=1000,
    )

    weight: float | None = Field(
        default=None,
        ge=0,
        le=500,
    )

    height: float | None = Field(
        default=None,
        ge=0,
        le=300,
    )

    notes: str | None = None


class VitalResponse(VitalBase):
    id: int
    recorded_at: datetime
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(
        from_attributes=True,
    )