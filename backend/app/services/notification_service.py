from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.notification import Notification
from app.models.user import User
from app.schemas.notification import (
    NotificationCreate,
    NotificationUpdate,
)


class NotificationService:

    VALID_PRIORITIES = {
        "low",
        "normal",
        "high",
        "urgent",
    }

    @staticmethod
    def _validate_priority(
        priority: str,
    ) -> None:

        if priority not in NotificationService.VALID_PRIORITIES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    "Invalid notification priority. "
                    "Allowed values: low, normal, high, urgent."
                ),
            )

    @staticmethod
    def _validate_user(
        db: Session,
        user_id: int,
    ) -> User:

        user = db.get(User, user_id)

        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found.",
            )

        return user

    @staticmethod
    def _apply_expiry(
        notification: Notification,
    ) -> None:

        if (
            notification.expires_at is not None
            and notification.expires_at <= datetime.now(timezone.utc)
        ):
            return

    @staticmethod
    def create(
        db: Session,
        data: NotificationCreate,
    ) -> Notification:

        duplicate = db.scalar(
            select(Notification).where(
                Notification.notification_number
                == data.notification_number
            )
        )

        if duplicate:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Notification number already exists.",
            )

        NotificationService._validate_user(
            db,
            data.user_id,
        )

        NotificationService._validate_priority(
            data.priority,
        )

        if data.expires_at is not None:
            if data.expires_at <= datetime.now(timezone.utc):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Notification expiry must be in the future.",
                )

        if data.is_read and data.read_at is None:
            read_at = datetime.now(timezone.utc)
        elif not data.is_read:
            read_at = None
        else:
            read_at = data.read_at

        notification = Notification(
            notification_number=data.notification_number,
            user_id=data.user_id,
            notification_type=data.notification_type,
            title=data.title,
            message=data.message,
            priority=data.priority,
            is_read=data.is_read,
            read_at=read_at,
            action_url=data.action_url,
            expires_at=data.expires_at,
        )

        db.add(notification)
        db.commit()
        db.refresh(notification)

        return notification

    @staticmethod
    def get(
        db: Session,
        notification_id: int,
    ) -> Notification:

        notification = db.get(
            Notification,
            notification_id,
        )

        if not notification:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Notification not found.",
            )

        return notification

    @staticmethod
    def get_by_number(
        db: Session,
        notification_number: str,
    ) -> Notification:

        notification = db.scalar(
            select(Notification).where(
                Notification.notification_number
                == notification_number
            )
        )

        if not notification:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Notification not found.",
            )

        return notification

    @staticmethod
    def list(
        db: Session,
        user_id: int | None = None,
        notification_type: str | None = None,
        priority: str | None = None,
        is_read: bool | None = None,
        include_expired: bool = False,
    ) -> list[Notification]:

        query = select(Notification).order_by(
            Notification.created_at.desc(),
            Notification.id.desc(),
        )

        if user_id is not None:
            query = query.where(
                Notification.user_id == user_id
            )

        if notification_type is not None:
            query = query.where(
                Notification.notification_type
                == notification_type
            )

        if priority is not None:
            NotificationService._validate_priority(
                priority
            )

            query = query.where(
                Notification.priority == priority
            )

        if is_read is not None:
            query = query.where(
                Notification.is_read == is_read
            )

        if not include_expired:
            now = datetime.now(timezone.utc)

            query = query.where(
                (Notification.expires_at.is_(None))
                | (Notification.expires_at > now)
            )

        return list(
            db.scalars(query).all()
        )

    @staticmethod
    def unread_count(
        db: Session,
        user_id: int,
    ) -> int:

        NotificationService._validate_user(
            db,
            user_id,
        )

        now = datetime.now(timezone.utc)

        query = select(Notification).where(
            Notification.user_id == user_id,
            Notification.is_read.is_(False),
            (
                Notification.expires_at.is_(None)
                | (Notification.expires_at > now)
            ),
        )

        return len(
            db.scalars(query).all()
        )

    @staticmethod
    def mark_as_read(
        db: Session,
        notification_id: int,
    ) -> Notification:

        notification = NotificationService.get(
            db,
            notification_id,
        )

        if not notification.is_read:
            notification.is_read = True
            notification.read_at = datetime.now(
                timezone.utc
            )

            db.commit()
            db.refresh(notification)

        return notification

    @staticmethod
    def mark_all_as_read(
        db: Session,
        user_id: int,
    ) -> int:

        NotificationService._validate_user(
            db,
            user_id,
        )

        notifications = db.scalars(
            select(Notification).where(
                Notification.user_id == user_id,
                Notification.is_read.is_(False),
            )
        ).all()

        now = datetime.now(timezone.utc)

        for notification in notifications:
            notification.is_read = True
            notification.read_at = now

        db.commit()

        return len(notifications)

    @staticmethod
    def update(
        db: Session,
        notification_id: int,
        data: NotificationUpdate,
    ) -> Notification:

        notification = NotificationService.get(
            db,
            notification_id,
        )

        values = data.model_dump(
            exclude_unset=True
        )

        new_number = values.get(
            "notification_number",
            notification.notification_number,
        )

        duplicate = db.scalar(
            select(Notification).where(
                Notification.notification_number
                == new_number,
                Notification.id != notification_id,
            )
        )

        if duplicate:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Notification number already exists.",
            )

        new_user_id = values.get(
            "user_id",
            notification.user_id,
        )

        NotificationService._validate_user(
            db,
            new_user_id,
        )

        new_priority = values.get(
            "priority",
            notification.priority,
        )

        NotificationService._validate_priority(
            new_priority,
        )

        new_expires_at = values.get(
            "expires_at",
            notification.expires_at,
        )

        if new_expires_at is not None:
            if new_expires_at <= datetime.now(timezone.utc):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Notification expiry must be in the future.",
                )

        if "is_read" in values:
            if values["is_read"]:
                if (
                    "read_at" not in values
                    or values["read_at"] is None
                ):
                    values["read_at"] = datetime.now(
                        timezone.utc
                    )
            else:
                values["read_at"] = None

        for field, value in values.items():
            setattr(
                notification,
                field,
                value,
            )

        db.commit()
        db.refresh(notification)

        return notification

    @staticmethod
    def delete(
        db: Session,
        notification_id: int,
    ) -> None:

        notification = NotificationService.get(
            db,
            notification_id,
        )

        db.delete(notification)
        db.commit()
