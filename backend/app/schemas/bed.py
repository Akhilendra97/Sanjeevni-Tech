from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class BedBase(BaseModel):
    ward_id: int = Field(..., gt=0)
    bed_number: str = Field(..., min_length=1, max_length=50)
    bed_type: str = Field(..., min_length=2, max_length=50)
    status: str = "available"
    is_active: bool = True
    notes: str | None = Field(default=None, max_length=500)


class BedCreate(BedBase):
    pass


class BedUpdate(BaseModel):
    ward_id: int | None = Field(default=None, gt=0)
    bed_number: str | None = Field(
        default=None,
        min_length=1,
        max_length=50,
    )
    bed_type: str | None = Field(
        default=None,
        min_length=2,
        max_length=50,
    )
    status: str | None = None
    is_active: bool | None = None
    notes: str | None = Field(default=None, max_length=500)


class BedResponse(BedBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)