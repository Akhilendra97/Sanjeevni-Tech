from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field


class EquipmentMaintenanceBase(BaseModel):
    equipment_id: int = Field(gt=0)
    maintenance_type: str = Field(min_length=1, max_length=100)
    maintenance_date: date
    description: str | None = None
    performed_by: str | None = Field(default=None, max_length=150)
    status: str = Field(default="completed", max_length=50)
    next_maintenance_date: date | None = None
    cost: float | None = Field(default=None, ge=0)
    notes: str | None = None


class EquipmentMaintenanceCreate(EquipmentMaintenanceBase):
    pass


class EquipmentMaintenanceUpdate(BaseModel):
    maintenance_type: str | None = Field(
        default=None,
        min_length=1,
        max_length=100,
    )
    maintenance_date: date | None = None
    description: str | None = None
    performed_by: str | None = Field(
        default=None,
        max_length=150,
    )
    status: str | None = Field(
        default=None,
        max_length=50,
    )
    next_maintenance_date: date | None = None
    cost: float | None = Field(
        default=None,
        ge=0,
    )
    notes: str | None = None


class EquipmentMaintenanceResponse(EquipmentMaintenanceBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    updated_at: datetime
