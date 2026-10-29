from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.audit_log import AuditLog
from app.schemas.audit_log import AuditLogCreate


def create_audit_log(
    db: Session,
    data: AuditLogCreate,
) -> AuditLog:
    audit_log = AuditLog(
        user_id=data.user_id,
        action=data.action,
        module=data.module,
        entity_type=data.entity_type,
        entity_id=data.entity_id,
        description=data.description,
        ip_address=data.ip_address,
        user_agent=data.user_agent,
    )

    db.add(audit_log)
    db.commit()
    db.refresh(audit_log)

    return audit_log


def get_audit_log_by_id(
    db: Session,
    audit_log_id: int,
) -> AuditLog | None:
    return db.get(AuditLog, audit_log_id)


def list_audit_logs(
    db: Session,
) -> list[AuditLog]:
    statement = select(AuditLog).order_by(
        AuditLog.created_at.desc(),
        AuditLog.id.desc(),
    )

    return list(db.scalars(statement).all())


def list_user_audit_logs(
    db: Session,
    user_id: int,
) -> list[AuditLog]:
    statement = (
        select(AuditLog)
        .where(AuditLog.user_id == user_id)
        .order_by(
            AuditLog.created_at.desc(),
            AuditLog.id.desc(),
        )
    )

    return list(db.scalars(statement).all())


def delete_audit_log(
    db: Session,
    audit_log: AuditLog,
) -> None:
    db.delete(audit_log)
    db.commit()


def record_audit_event(
    db: Session,
    *,
    user_id: int | None,
    action: str,
    module: str,
    description: str | None = None,
    entity_type: str | None = None,
    entity_id: int | None = None,
    ip_address: str | None = None,
    user_agent: str | None = None,
) -> AuditLog | None:
    """
    Persist a server-generated audit event.
    Audit failures must not silently corrupt the caller's transaction;
    callers should invoke this only after their business transaction commits.
    """
    try:
        event = AuditLog(
            user_id=user_id,
            action=action[:100],
            module=module[:100],
            description=description,
            entity_type=entity_type[:100] if entity_type else None,
            entity_id=entity_id,
            ip_address=ip_address[:45] if ip_address else None,
            user_agent=user_agent,
        )
        db.add(event)
        db.commit()
        db.refresh(event)
        return event
    except Exception:
        db.rollback()
        # Do not fail a successful business operation because audit logging failed.
        return None

