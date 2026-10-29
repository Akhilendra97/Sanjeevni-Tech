from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import require_permission
from app.schemas.audit_log import AuditLogResponse
from app.services.audit_log_service import (
    get_audit_log_by_id,
    list_audit_logs,
    list_user_audit_logs,
    delete_audit_log,
)

router = APIRouter(
    prefix="/audit-logs",
    tags=["Audit Logs"],
)


@router.get(
    "",
    response_model=list[AuditLogResponse],
    dependencies=[Depends(require_permission("audit.view"))],
)
def get_audit_logs(db: Session = Depends(get_db)):
    return list_audit_logs(db)


@router.get(
    "/user/{user_id}",
    response_model=list[AuditLogResponse],
    dependencies=[Depends(require_permission("audit.view"))],
)
def get_user_audit_logs(
    user_id: int,
    db: Session = Depends(get_db),
):
    return list_user_audit_logs(db, user_id)


@router.get(
    "/{audit_log_id}",
    response_model=AuditLogResponse,
    dependencies=[Depends(require_permission("audit.view"))],
)
def get_audit_log(
    audit_log_id: int,
    db: Session = Depends(get_db),
):
    audit_log = get_audit_log_by_id(db, audit_log_id)

    if audit_log is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Audit log not found",
        )

    return audit_log


@router.delete(
    "/{audit_log_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(require_permission("system.manage"))],
)
def remove_audit_log(
    audit_log_id: int,
    db: Session = Depends(get_db),
):
    audit_log = get_audit_log_by_id(db, audit_log_id)

    if audit_log is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Audit log not found",
        )

    delete_audit_log(db, audit_log)
    return None



