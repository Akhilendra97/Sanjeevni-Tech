from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.constants import UserRole
from app.core.database import get_db
from app.core.dependencies import get_current_user_payload, require_role
from app.models.notification import Notification
from app.schemas.notification import NotificationCreate, NotificationResponse, NotificationUpdate
from app.services.notification_service import NotificationService

router = APIRouter(prefix="/notifications", tags=["Notifications"])


def _current_user_id(payload: dict) -> int:
    try:
        return int(payload.get("sub"))
    except (TypeError, ValueError):
        raise HTTPException(status_code=401, detail="Invalid authenticated user.", headers={"WWW-Authenticate": "Bearer"})


def _owned_notification(db: Session, notification_id: int, user_id: int) -> Notification:
    item = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.user_id == user_id,
    ).first()
    if item is None:
        # Return the same response for missing and foreign records to avoid ID probing.
        raise HTTPException(status_code=404, detail="Notification not found.")
    return item


@router.post("", response_model=NotificationResponse, status_code=status.HTTP_201_CREATED)
def create_notification(
    data: NotificationCreate,
    db: Session = Depends(get_db),
    _: dict = Depends(require_role(UserRole.ADMIN)),
):
    # Notification creation is an administrative operation; recipient identity is
    # accepted only from an authorized administrator, never from a regular user.
    return NotificationService.create(db, data)


@router.get("", response_model=list[NotificationResponse])
def list_notifications(
    notification_type: str | None = Query(default=None),
    priority: str | None = Query(default=None),
    is_read: bool | None = Query(default=None),
    include_expired: bool = Query(default=False),
    limit: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
    payload: dict = Depends(get_current_user_payload),
):
    user_id = _current_user_id(payload)
    query = db.query(Notification).filter(Notification.user_id == user_id)
    if notification_type is not None:
        query = query.filter(Notification.notification_type == notification_type)
    if priority is not None:
        NotificationService._validate_priority(priority)
        query = query.filter(Notification.priority == priority)
    if is_read is not None:
        query = query.filter(Notification.is_read.is_(is_read))
    if not include_expired:
        now = datetime.now(timezone.utc)
        query = query.filter((Notification.expires_at.is_(None)) | (Notification.expires_at > now))
    return query.order_by(Notification.created_at.desc(), Notification.id.desc()).limit(limit).all()


@router.get("/unread-count/me")
def unread_notification_count(
    db: Session = Depends(get_db),
    payload: dict = Depends(get_current_user_payload),
):
    user_id = _current_user_id(payload)
    now = datetime.now(timezone.utc)
    count = db.query(Notification.id).filter(
        Notification.user_id == user_id,
        Notification.is_read.is_(False),
        (Notification.expires_at.is_(None)) | (Notification.expires_at > now),
    ).count()
    return {"unread_count": count}


@router.get("/unread-count/{user_id}")
def unread_notification_count_compat(
    user_id: int,
    db: Session = Depends(get_db),
    payload: dict = Depends(get_current_user_payload),
):
    current_id = _current_user_id(payload)
    if user_id != current_id:
        raise HTTPException(status_code=404, detail="Notification not found.")
    now = datetime.now(timezone.utc)
    count = db.query(Notification.id).filter(
        Notification.user_id == current_id,
        Notification.is_read.is_(False),
        (Notification.expires_at.is_(None)) | (Notification.expires_at > now),
    ).count()
    return {"user_id": current_id, "unread_count": count}


@router.get("/number/{notification_number}", response_model=NotificationResponse)
def get_notification_by_number(
    notification_number: str,
    db: Session = Depends(get_db),
    payload: dict = Depends(get_current_user_payload),
):
    item = db.query(Notification).filter(
        Notification.notification_number == notification_number,
        Notification.user_id == _current_user_id(payload),
    ).first()
    if item is None:
        raise HTTPException(status_code=404, detail="Notification not found.")
    return item


@router.get("/{notification_id}", response_model=NotificationResponse)
def get_notification(
    notification_id: int,
    db: Session = Depends(get_db),
    payload: dict = Depends(get_current_user_payload),
):
    return _owned_notification(db, notification_id, _current_user_id(payload))


@router.patch("/{notification_id}/read", response_model=NotificationResponse)
def mark_notification_as_read(
    notification_id: int,
    db: Session = Depends(get_db),
    payload: dict = Depends(get_current_user_payload),
):
    item = _owned_notification(db, notification_id, _current_user_id(payload))
    if not item.is_read:
        item.is_read = True
        item.read_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(item)
    return item


@router.patch("/read-all/me")
def mark_all_notifications_as_read(
    db: Session = Depends(get_db),
    payload: dict = Depends(get_current_user_payload),
):
    user_id = _current_user_id(payload)
    now = datetime.now(timezone.utc)
    count = db.query(Notification).filter(
        Notification.user_id == user_id,
        Notification.is_read.is_(False),
    ).update({"is_read": True, "read_at": now}, synchronize_session=False)
    db.commit()
    return {"marked_as_read": count}


@router.patch("/user/{user_id}/read-all")
def mark_all_notifications_as_read_compat(
    user_id: int,
    db: Session = Depends(get_db),
    payload: dict = Depends(get_current_user_payload),
):
    current_id = _current_user_id(payload)
    if user_id != current_id:
        raise HTTPException(status_code=404, detail="Notification not found.")
    now = datetime.now(timezone.utc)
    count = db.query(Notification).filter(
        Notification.user_id == current_id,
        Notification.is_read.is_(False),
    ).update({"is_read": True, "read_at": now}, synchronize_session=False)
    db.commit()
    return {"user_id": current_id, "marked_as_read": count}


@router.put("/{notification_id}", response_model=NotificationResponse)
def update_notification(
    notification_id: int,
    data: NotificationUpdate,
    db: Session = Depends(get_db),
    _: dict = Depends(require_role(UserRole.ADMIN)),
):
    # Only admins can edit notification content or change its recipient.
    return NotificationService.update(db, notification_id, data)


@router.delete("/{notification_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_notification(
    notification_id: int,
    db: Session = Depends(get_db),
    _: dict = Depends(require_role(UserRole.ADMIN)),
):
    NotificationService.delete(db, notification_id)
    return None
