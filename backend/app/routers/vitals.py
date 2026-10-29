from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.constants import UserRole
from app.core.database import get_db
from app.core.dependencies import get_current_user_payload, require_permission
from app.models.nurse import Nurse
from app.models.nurse_patient_assignment import NursePatientAssignment
from app.models.vital import Vital
from app.schemas.vital import VitalCreate, VitalResponse, VitalUpdate
from app.services.vital_service import create_vital, delete_vital, get_vital_by_id, list_vitals, update_vital

router = APIRouter(prefix="/vitals", tags=["Vitals"])

def _nurse_for_payload(db: Session, payload: dict):
    if payload.get("role") != UserRole.NURSE.value:
        return None
    try:
        user_id = int(payload.get("sub"))
    except (TypeError, ValueError):
        raise HTTPException(status_code=401, detail="Invalid authenticated user.")
    nurse = db.query(Nurse).filter(Nurse.user_id == user_id).first()
    if not nurse:
        raise HTTPException(status_code=404, detail="Nurse profile is not linked to this account.")
    return nurse

def _is_assigned(db: Session, nurse_id: int, patient_id: int) -> bool:
    return db.query(NursePatientAssignment.id).filter(
        NursePatientAssignment.nurse_id == nurse_id,
        NursePatientAssignment.patient_id == patient_id,
        NursePatientAssignment.status == "active",
    ).first() is not None

def _ensure_vital_access(db: Session, vital: Vital, nurse):
    if nurse is not None and not _is_assigned(db, nurse.id, vital.patient_id):
        raise HTTPException(status_code=404, detail="Vital record not found for this nursing account.")

@router.post("", response_model=VitalResponse, status_code=status.HTTP_201_CREATED,
             dependencies=[Depends(require_permission("vitals.manage"))])
def create(request: VitalCreate, db: Session = Depends(get_db), payload: dict = Depends(get_current_user_payload)) -> Vital:
    nurse = _nurse_for_payload(db, payload)
    if nurse is not None and not _is_assigned(db, nurse.id, request.patient_id):
        raise HTTPException(status_code=403, detail="You can record vitals only for patients assigned to your nursing account.")
    try:
        return create_vital(db, patient_id=request.patient_id, temperature=request.temperature,
            heart_rate=request.heart_rate, respiratory_rate=request.respiratory_rate,
            systolic_bp=request.systolic_bp, diastolic_bp=request.diastolic_bp,
            oxygen_saturation=request.oxygen_saturation, blood_glucose=request.blood_glucose,
            weight=request.weight, height=request.height, notes=request.notes)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

@router.get("", response_model=list[VitalResponse], dependencies=[Depends(require_permission("vitals.view"))])
def get_all(patient_id: int | None = None, db: Session = Depends(get_db), payload: dict = Depends(get_current_user_payload)) -> list[Vital]:
    nurse = _nurse_for_payload(db, payload)
    if nurse is None:
        return list_vitals(db, patient_id=patient_id)
    q = db.query(Vital).join(NursePatientAssignment, NursePatientAssignment.patient_id == Vital.patient_id).filter(
        NursePatientAssignment.nurse_id == nurse.id, NursePatientAssignment.status == "active")
    if patient_id is not None:
        if not _is_assigned(db, nurse.id, patient_id):
            return []
        q = q.filter(Vital.patient_id == patient_id)
    return q.order_by(Vital.recorded_at.desc(), Vital.id.desc()).all()

@router.get("/{vital_id}", response_model=VitalResponse, dependencies=[Depends(require_permission("vitals.view"))])
def get_one(vital_id: int, db: Session = Depends(get_db), payload: dict = Depends(get_current_user_payload)) -> Vital:
    vital = get_vital_by_id(db, vital_id)
    if vital is None: raise HTTPException(status_code=404, detail="Vital record not found.")
    _ensure_vital_access(db, vital, _nurse_for_payload(db, payload))
    return vital

@router.patch("/{vital_id}", response_model=VitalResponse, dependencies=[Depends(require_permission("vitals.manage"))])
def update(vital_id: int, request: VitalUpdate, db: Session = Depends(get_db), payload: dict = Depends(get_current_user_payload)) -> Vital:
    vital = get_vital_by_id(db, vital_id)
    if vital is None: raise HTTPException(status_code=404, detail="Vital record not found.")
    _ensure_vital_access(db, vital, _nurse_for_payload(db, payload))
    return update_vital(db, vital, temperature=request.temperature, heart_rate=request.heart_rate,
        respiratory_rate=request.respiratory_rate, systolic_bp=request.systolic_bp,
        diastolic_bp=request.diastolic_bp, oxygen_saturation=request.oxygen_saturation,
        blood_glucose=request.blood_glucose, weight=request.weight, height=request.height, notes=request.notes)

@router.delete("/{vital_id}", status_code=status.HTTP_204_NO_CONTENT,
               dependencies=[Depends(require_permission("vitals.manage"))])
def delete(vital_id: int, db: Session = Depends(get_db), payload: dict = Depends(get_current_user_payload)) -> None:
    vital = get_vital_by_id(db, vital_id)
    if vital is None: raise HTTPException(status_code=404, detail="Vital record not found.")
    _ensure_vital_access(db, vital, _nurse_for_payload(db, payload))
    delete_vital(db, vital)
