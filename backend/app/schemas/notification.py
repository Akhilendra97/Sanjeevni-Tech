from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class NotificationBase(BaseModel):
    notification_number: str = Field(
        ...,
        min_length=1,
        max_length=100,
    )

    user_id: int

    notification_type: str = Field(
        ...,
        min_length=1,
        max_length=50,
    )

    title: str = Field(
        ...,
        min_length=1,
        max_length=200,
    )

    message: str = Field(
        ...,
        min_length=1,
    )

    priority: str = Field(
        default="normal",
        min_length=1,
        max_length=30,
    )

    is_read: bool = False

    read_at: datetime | None = None

    action_url: str | None = Field(
        default=None,
        max_length=500,
    )

    expires_at: datetime | None = None


class NotificationCreate(NotificationBase):
    pass


class NotificationUpdate(BaseModel):
    notification_number: str | None = Field(
        default=None,
        min_length=1,
        max_length=100,
    )

    user_id: int | None = None

    notification_type: str | None = Field(
        default=None,
        min_length=1,
        max_length=50,
    )

    title: str | None = Field(
        default=None,
        min_length=1,
        max_length=200,
    )

    message: str | None = Field(
        default=None,
        min_length=1,
    )

    priority: str | None = Field(
        default=None,
        min_length=1,
        max_length=30,
    )

    is_read: bool | None = None

    read_at: datetime | None = None

    action_url: str | None = Field(
        default=None,
        max_length=500,
    )

    expires_at: datetime | None = None


class NotificationResponse(NotificationBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    updated_at: datetime
