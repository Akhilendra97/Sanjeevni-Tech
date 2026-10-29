from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.constants import UserRole
from app.core.database import get_db
from app.core.dependencies import get_current_user_payload, require_permission
from app.models.doctor import Doctor
from app.models.prescription import Prescription
from app.schemas.prescription import (
    PrescriptionCreate,
    PrescriptionResponse,
    PrescriptionUpdate,
)
from app.services.prescription_service import (
    create_prescription,
    delete_prescription,
    get_prescription_by_id,
    update_prescription,
)

router = APIRouter(prefix="/prescriptions", tags=["Prescriptions"])


def _current_doctor(db: Session, payload: dict) -> Doctor:
    try:
        user_id = int(payload.get("sub"))
    except (TypeError, ValueError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authenticated user.",
        )

    doctor = db.query(Doctor).filter(Doctor.user_id == user_id).first()
    if doctor is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Doctor profile is not linked to this account.",
        )
    return doctor


def _ensure_prescription_access(
    prescription: Prescription,
    payload: dict,
    db: Session,
) -> None:
    if payload.get("role") != UserRole.DOCTOR.value:
        return

    doctor = _current_doctor(db, payload)
    if prescription.doctor_id != doctor.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can access only your own prescriptions.",
        )


@router.post(
    "",
    response_model=PrescriptionResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_permission("prescriptions.manage"))],
)
def create(
    request: PrescriptionCreate,
    db: Session = Depends(get_db),
    payload: dict = Depends(get_current_user_payload),
) -> Prescription:
    if payload.get("role") == UserRole.DOCTOR.value:
        doctor = _current_doctor(db, payload)
        if request.doctor_id != doctor.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can create prescriptions only under your own doctor profile.",
            )

    try:
        return create_prescription(
            db,
            prescription_number=request.prescription_number,
            patient_id=request.patient_id,
            doctor_id=request.doctor_id,
            prescription_date=request.prescription_date,
            diagnosis=request.diagnosis,
            medicines=request.medicines,
            instructions=request.instructions,
            duration=request.duration,
            follow_up_date=request.follow_up_date,
            notes=request.notes,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc


@router.get(
    "",
    response_model=list[PrescriptionResponse],
    dependencies=[Depends(require_permission("prescriptions.view"))],
)
def get_all(
    db: Session = Depends(get_db),
    payload: dict = Depends(get_current_user_payload),
) -> list[Prescription]:
    query = db.query(Prescription)

    if payload.get("role") == UserRole.DOCTOR.value:
        doctor = _current_doctor(db, payload)
        query = query.filter(Prescription.doctor_id == doctor.id)

    return query.order_by(Prescription.id.desc()).all()


@router.get(
    "/{prescription_id}",
    response_model=PrescriptionResponse,
    dependencies=[Depends(require_permission("prescriptions.view"))],
)
def get_one(
    prescription_id: int,
    db: Session = Depends(get_db),
    payload: dict = Depends(get_current_user_payload),
) -> Prescription:
    prescription = get_prescription_by_id(db, prescription_id)
    if prescription is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Prescription not found.",
        )

    _ensure_prescription_access(prescription, payload, db)
    return prescription


@router.patch(
    "/{prescription_id}",
    response_model=PrescriptionResponse,
    dependencies=[Depends(require_permission("prescriptions.manage"))],
)
def update(
    prescription_id: int,
    request: PrescriptionUpdate,
    db: Session = Depends(get_db),
    payload: dict = Depends(get_current_user_payload),
) -> Prescription:
    prescription = get_prescription_by_id(db, prescription_id)
    if prescription is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Prescription not found.",
        )

    _ensure_prescription_access(prescription, payload, db)
    return update_prescription(
        db,
        prescription,
        prescription_date=request.prescription_date,
        diagnosis=request.diagnosis,
        medicines=request.medicines,
        instructions=request.instructions,
        duration=request.duration,
        follow_up_date=request.follow_up_date,
        notes=request.notes,
    )


@router.delete(
    "/{prescription_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(require_permission("prescriptions.manage"))],
)
def delete(
    prescription_id: int,
    db: Session = Depends(get_db),
    payload: dict = Depends(get_current_user_payload),
) -> None:
    prescription = get_prescription_by_id(db, prescription_id)
    if prescription is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Prescription not found.",
        )

    _ensure_prescription_access(prescription, payload, db)
    delete_prescription(db, prescription)
