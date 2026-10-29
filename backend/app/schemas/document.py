from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field


class DocumentBase(BaseModel):
    patient_id: int = Field(..., gt=0)
    uploaded_by: int | None = Field(default=None, gt=0)

    document_type: str = Field(
        ...,
        min_length=1,
        max_length=100,
    )

    document_title: str = Field(
        ...,
        min_length=1,
        max_length=200,
    )

    file_name: str = Field(
        ...,
        min_length=1,
        max_length=255,
    )

    file_path: str = Field(
        ...,
        min_length=1,
        max_length=500,
    )

    mime_type: str | None = Field(
        default=None,
        max_length=100,
    )

    file_size: int | None = Field(
        default=None,
        ge=0,
    )

    document_date: date | None = None

    description: str | None = None

    is_active: bool = True


class DocumentCreate(DocumentBase):
    pass


class DocumentUpdate(BaseModel):
    patient_id: int | None = Field(default=None, gt=0)
    uploaded_by: int | None = Field(default=None, gt=0)

    document_type: str | None = Field(
        default=None,
        min_length=1,
        max_length=100,
    )

    document_title: str | None = Field(
        default=None,
        min_length=1,
        max_length=200,
    )

    file_name: str | None = Field(
        default=None,
        min_length=1,
        max_length=255,
    )

    file_path: str | None = Field(
        default=None,
        min_length=1,
        max_length=500,
    )

    mime_type: str | None = Field(
        default=None,
        max_length=100,
    )

    file_size: int | None = Field(
        default=None,
        ge=0,
    )

    document_date: date | None = None

    description: str | None = None

    is_active: bool | None = None


class DocumentResponse(DocumentBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(
        from_attributes=True,
    )
