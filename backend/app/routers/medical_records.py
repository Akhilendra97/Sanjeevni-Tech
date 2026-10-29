from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.constants import UserRole
from app.core.database import get_db
from app.core.dependencies import get_current_user_payload, require_permission
from app.models.doctor import Doctor
from app.models.medical_record import MedicalRecord
from app.schemas.medical_record import (
    MedicalRecordCreate,
    MedicalRecordResponse,
    MedicalRecordUpdate,
)
from app.services.medical_record_service import (
    create_medical_record,
    delete_medical_record,
    get_medical_record_by_id,
    list_medical_records,
    update_medical_record,
)

router = APIRouter(prefix="/medical-records", tags=["Medical Records"])


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


def _ensure_record_access(
    record: MedicalRecord,
    payload: dict,
    db: Session,
) -> None:
    if payload.get("role") != UserRole.DOCTOR.value:
        return

    doctor = _current_doctor(db, payload)
    if record.doctor_id != doctor.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can access only your own medical records.",
        )


@router.post(
    "",
    response_model=MedicalRecordResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_permission("emr.manage"))],
)
def create(
    request: MedicalRecordCreate,
    db: Session = Depends(get_db),
    payload: dict = Depends(get_current_user_payload),
) -> MedicalRecord:
    if payload.get("role") == UserRole.DOCTOR.value:
        doctor = _current_doctor(db, payload)
        if request.doctor_id != doctor.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can create records only under your own doctor profile.",
            )

    try:
        return create_medical_record(
            db,
            patient_id=request.patient_id,
            doctor_id=request.doctor_id,
            record_number=request.record_number,
            chief_complaint=request.chief_complaint,
            symptoms=request.symptoms,
            diagnosis=request.diagnosis,
            treatment_plan=request.treatment_plan,
            clinical_notes=request.clinical_notes,
            medical_history=request.medical_history,
            allergies=request.allergies,
            record_type=request.record_type,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc


@router.get(
    "",
    response_model=list[MedicalRecordResponse],
    dependencies=[Depends(require_permission("emr.view"))],
)
def get_all(
    db: Session = Depends(get_db),
    payload: dict = Depends(get_current_user_payload),
) -> list[MedicalRecord]:
    records = list_medical_records(db)

    if payload.get("role") == UserRole.DOCTOR.value:
        doctor = _current_doctor(db, payload)
        records = [record for record in records if record.doctor_id == doctor.id]

    return records


@router.get(
    "/{record_id}",
    response_model=MedicalRecordResponse,
    dependencies=[Depends(require_permission("emr.view"))],
)
def get_one(
    record_id: int,
    db: Session = Depends(get_db),
    payload: dict = Depends(get_current_user_payload),
) -> MedicalRecord:
    record = get_medical_record_by_id(db, record_id)

    if record is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Medical record not found.",
        )

    _ensure_record_access(record, payload, db)
    return record


@router.patch(
    "/{record_id}",
    response_model=MedicalRecordResponse,
    dependencies=[Depends(require_permission("emr.manage"))],
)
def update(
    record_id: int,
    request: MedicalRecordUpdate,
    db: Session = Depends(get_db),
    payload: dict = Depends(get_current_user_payload),
) -> MedicalRecord:
    record = get_medical_record_by_id(db, record_id)

    if record is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Medical record not found.",
        )

    _ensure_record_access(record, payload, db)

    return update_medical_record(
        db,
        record,
        chief_complaint=request.chief_complaint,
        symptoms=request.symptoms,
        diagnosis=request.diagnosis,
        treatment_plan=request.treatment_plan,
        clinical_notes=request.clinical_notes,
        medical_history=request.medical_history,
        allergies=request.allergies,
        record_type=request.record_type,
    )


@router.delete(
    "/{record_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(require_permission("emr.manage"))],
)
def delete(
    record_id: int,
    db: Session = Depends(get_db),
    payload: dict = Depends(get_current_user_payload),
) -> None:
    record = get_medical_record_by_id(db, record_id)

    if record is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Medical record not found.",
        )

    _ensure_record_access(record, payload, db)
    delete_medical_record(db, record)
