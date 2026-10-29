from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.audit_log import AuditLog
from app.schemas.audit_log import AuditLogCreate, AuditLogResponse
from app.services.audit_log_service import (
    create_audit_log,
    get_audit_log_by_id,
    list_audit_logs,
    list_user_audit_logs,
    delete_audit_log,
)


router = APIRouter(
    prefix="/audit-logs",
    tags=["Audit Logs"],
)


@router.post(
    "",
    response_model=AuditLogResponse,
    status_code=status.HTTP_201_CREATED,
)
def create(
    request: AuditLogCreate,
    db: Session = Depends(get_db),
) -> AuditLog:
    return create_audit_log(
        db,
        request,
    )


@router.get(
    "",
    response_model=list[AuditLogResponse],
)
def get_all(
    db: Session = Depends(get_db),
) -> list[AuditLog]:
    return list_audit_logs(db)


@router.get(
    "/user/{user_id}",
    response_model=list[AuditLogResponse],
)
def get_by_user(
    user_id: int,
    db: Session = Depends(get_db),
) -> list[AuditLog]:
    if user_id <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid user ID.",
        )

    return list_user_audit_logs(
        db,
        user_id,
    )


@router.get(
    "/{audit_log_id}",
    response_model=AuditLogResponse,
)
def get_one(
    audit_log_id: int,
    db: Session = Depends(get_db),
) -> AuditLog:
    audit_log = get_audit_log_by_id(
        db,
        audit_log_id,
    )

    if audit_log is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Audit log not found.",
        )

    return audit_log


@router.delete(
    "/{audit_log_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete(
    audit_log_id: int,
    db: Session = Depends(get_db),
) -> None:
    audit_log = get_audit_log_by_id(
        db,
        audit_log_id,
    )

    if audit_log is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Audit log not found.",
        )

    delete_audit_log(
        db,
        audit_log,
    )
