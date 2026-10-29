from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field


class DietBase(BaseModel):
    patient_id: int = Field(..., gt=0)
    prescribed_by: int | None = Field(default=None, gt=0)

    diet_type: str = Field(..., min_length=1, max_length=100)
    meal_type: str | None = Field(default=None, max_length=50)

    diet_date: date

    calories: int | None = Field(default=None, ge=0)

    instructions: str | None = None
    restrictions: str | None = None
    notes: str | None = None


class DietCreate(DietBase):
    pass


class DietUpdate(BaseModel):
    patient_id: int | None = Field(default=None, gt=0)
    prescribed_by: int | None = Field(default=None, gt=0)

    diet_type: str | None = Field(default=None, min_length=1, max_length=100)
    meal_type: str | None = Field(default=None, max_length=50)

    diet_date: date | None = None

    calories: int | None = Field(default=None, ge=0)

    instructions: str | None = None
    restrictions: str | None = None
    notes: str | None = None


class DietResponse(DietBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
