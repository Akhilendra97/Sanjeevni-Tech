from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class VisitorBase(BaseModel):
    visitor_number: str = Field(
        ...,
        min_length=1,
        max_length=100,
    )
    patient_id: int
    visitor_name: str = Field(
        ...,
        min_length=1,
        max_length=150,
    )
    relationship_to_patient: str | None = Field(
        default=None,
        max_length=100,
    )
    contact_number: str | None = Field(
        default=None,
        max_length=30,
    )
    id_proof_type: str | None = Field(
        default=None,
        max_length=50,
    )
    id_proof_number: str | None = Field(
        default=None,
        max_length=100,
    )
    purpose: str = Field(
        ...,
        min_length=1,
        max_length=200,
    )
    entry_time: datetime
    exit_time: datetime | None = None
    status: str = Field(
        default="checked_in",
        min_length=1,
        max_length=30,
    )
    notes: str | None = None


class VisitorCreate(VisitorBase):
    pass


class VisitorUpdate(BaseModel):
    visitor_number: str | None = Field(
        default=None,
        min_length=1,
        max_length=100,
    )
    patient_id: int | None = None
    visitor_name: str | None = Field(
        default=None,
        min_length=1,
        max_length=150,
    )
    relationship_to_patient: str | None = Field(
        default=None,
        max_length=100,
    )
    contact_number: str | None = Field(
        default=None,
        max_length=30,
    )
    id_proof_type: str | None = Field(
        default=None,
        max_length=50,
    )
    id_proof_number: str | None = Field(
        default=None,
        max_length=100,
    )
    purpose: str | None = Field(
        default=None,
        min_length=1,
        max_length=200,
    )
    entry_time: datetime | None = None
    exit_time: datetime | None = None
    status: str | None = Field(
        default=None,
        min_length=1,
        max_length=30,
    )
    notes: str | None = None


class VisitorResponse(VisitorBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
