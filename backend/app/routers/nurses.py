from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.core.constants import UserRole
from app.core.database import get_db
from app.core.dependencies import get_current_user_payload, require_permission
from app.models.nurse import Nurse
from app.schemas.nurse import NurseCreate, NurseResponse, NurseUpdate
from app.services.nurse_service import (
    create_nurse, delete_nurse, get_nurse_by_id, list_nurses, update_nurse,
)

router = APIRouter(prefix="/nurses", tags=["Nurses"])


def _payload_user_id(payload: dict) -> int:
    try:
        return int(payload.get("sub"))
    except (TypeError, ValueError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authenticated user.",
            headers={"WWW-Authenticate": "Bearer"},
        )


@router.get("/me", response_model=NurseResponse)
def get_my_nurse_profile(
    payload: dict = Depends(get_current_user_payload),
    db: Session = Depends(get_db),
) -> Nurse:
    """Return only the nurse profile linked to the authenticated account."""
    if payload.get("role") != UserRole.NURSE.value:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This endpoint is available to nurse accounts only.",
        )
    user_id = _payload_user_id(payload)
    nurse = (
        db.query(Nurse)
        .options(joinedload(Nurse.user), joinedload(Nurse.department))
        .filter(Nurse.user_id == user_id)
        .first()
    )
    if nurse is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No nurse profile is linked to this account.",
        )
    return nurse


@router.post(
    "",
    response_model=NurseResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_permission("nurses.manage"))],
)
def create(request: NurseCreate, db: Session = Depends(get_db)) -> Nurse:
    try:
        return create_nurse(
            db,
            user_id=request.user_id,
            full_name=request.full_name,
            department_id=request.department_id,
            employee_id=request.employee_id,
            nursing_registration_number=request.nursing_registration_number,
            qualification=request.qualification,
            joining_date=request.joining_date,
            is_available=request.is_available,
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.get(
    "",
    response_model=list[NurseResponse],
    dependencies=[Depends(require_permission("nurses.view"))],
)
def get_all(db: Session = Depends(get_db)) -> list[Nurse]:
    return (
        db.query(Nurse)
        .options(joinedload(Nurse.user), joinedload(Nurse.department))
        .order_by(Nurse.id.desc())
        .all()
    )


@router.get(
    "/{nurse_id}",
    response_model=NurseResponse,
    dependencies=[Depends(require_permission("nurses.view"))],
)
def get_one(nurse_id: int, db: Session = Depends(get_db)) -> Nurse:
    nurse = (db.query(Nurse).options(joinedload(Nurse.user), joinedload(Nurse.department)).filter(Nurse.id == nurse_id).first())
    if nurse is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Nurse not found.")
    return nurse


@router.patch(
    "/{nurse_id}",
    response_model=NurseResponse,
    dependencies=[Depends(require_permission("nurses.manage"))],
)
def update(nurse_id: int, request: NurseUpdate, db: Session = Depends(get_db)) -> Nurse:
    nurse = get_nurse_by_id(db, nurse_id)
    if nurse is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Nurse not found.")
    try:
        return update_nurse(
            db,
            nurse,
            user_id=request.user_id,
            full_name=request.full_name,
            department_id=request.department_id,
            employee_id=request.employee_id,
            nursing_registration_number=request.nursing_registration_number,
            qualification=request.qualification,
            joining_date=request.joining_date,
            is_available=request.is_available,
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.delete(
    "/{nurse_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(require_permission("nurses.manage"))],
)
def delete(nurse_id: int, db: Session = Depends(get_db)) -> None:
    nurse = get_nurse_by_id(db, nurse_id)
    if nurse is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Nurse not found.")
    delete_nurse(db, nurse)
