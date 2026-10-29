from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class AuditLogBase(BaseModel):
    user_id: int | None = Field(default=None, gt=0)
    action: str = Field(min_length=1, max_length=100)
    module: str = Field(min_length=1, max_length=100)
    entity_type: str | None = Field(default=None, max_length=100)
    entity_id: int | None = Field(default=None, gt=0)
    description: str | None = None
    ip_address: str | None = Field(default=None, max_length=45)
    user_agent: str | None = None


class AuditLogCreate(AuditLogBase):
    pass


class AuditLogResponse(AuditLogBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
