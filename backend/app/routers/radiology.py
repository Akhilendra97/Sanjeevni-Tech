from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.constants import UserRole
from app.core.dependencies import get_current_user_payload, require_permission
from app.core.database import get_db
from app.models.doctor import Doctor
from app.models.radiology import Radiology
from app.schemas.radiology import RadiologyCreate, RadiologyResponse, RadiologyUpdate
from app.services.radiology_service import RadiologyService

router = APIRouter(prefix="/radiology", tags=["Radiology Management"])


def _doctor_for_payload(db: Session, payload: dict) -> Doctor:
    try:
        user_id = int(payload.get("sub"))
    except (TypeError, ValueError):
        raise HTTPException(status_code=401, detail="Invalid authenticated user.")
    doctor = db.query(Doctor).filter(Doctor.user_id == user_id).first()
    if doctor is None:
        raise HTTPException(status_code=403, detail="Doctor profile is not linked to this account.")
    return doctor


def _check_record_access(db: Session, record: Radiology, payload: dict) -> None:
    if payload.get("role") == UserRole.DOCTOR.value:
        doctor = _doctor_for_payload(db, payload)
        if record.doctor_id != doctor.id:
            # Use 404 to avoid disclosing another doctor's record existence.
            raise HTTPException(status_code=404, detail="Radiology record not found.")


@router.post("", response_model=RadiologyResponse, status_code=status.HTTP_201_CREATED,
             dependencies=[Depends(require_permission("radiology.manage"))])
def create_radiology(data: RadiologyCreate, db: Session = Depends(get_db),
                     payload: dict = Depends(get_current_user_payload)):
    if payload.get("role") == UserRole.DOCTOR.value:
        doctor = _doctor_for_payload(db, payload)
        if data.doctor_id != doctor.id:
            raise HTTPException(status_code=403, detail="You can create radiology requests only under your own doctor profile.")
    return RadiologyService.create(db, data)


@router.get("", response_model=list[RadiologyResponse],
            dependencies=[Depends(require_permission("radiology.view"))])
def list_radiology(patient_id: int | None = Query(default=None), doctor_id: int | None = Query(default=None),
                   examination_type: str | None = Query(default=None), body_part: str | None = Query(default=None),
                   priority: str | None = Query(default=None), status_value: str | None = Query(default=None),
                   contrast_used: bool | None = Query(default=None), db: Session = Depends(get_db),
                   payload: dict = Depends(get_current_user_payload)):
    # A doctor-supplied query parameter must never widen their scope.
    if payload.get("role") == UserRole.DOCTOR.value:
        own_id = _doctor_for_payload(db, payload).id
        if doctor_id is not None and doctor_id != own_id:
            return []
        doctor_id = own_id
    return RadiologyService.list(db, patient_id=patient_id, doctor_id=doctor_id,
        examination_type=examination_type, body_part=body_part, priority=priority,
        status_value=status_value, contrast_used=contrast_used)


@router.get("/number/{radiology_number}", response_model=RadiologyResponse,
            dependencies=[Depends(require_permission("radiology.view"))])
def get_radiology_by_number(radiology_number: str, db: Session = Depends(get_db),
                           payload: dict = Depends(get_current_user_payload)):
    record = RadiologyService.get_by_number(db, radiology_number)
    _check_record_access(db, record, payload)
    return record


@router.get("/{radiology_id}", response_model=RadiologyResponse,
            dependencies=[Depends(require_permission("radiology.view"))])
def get_radiology(radiology_id: int, db: Session = Depends(get_db),
                  payload: dict = Depends(get_current_user_payload)):
    record = RadiologyService.get(db, radiology_id)
    _check_record_access(db, record, payload)
    return record


@router.put("/{radiology_id}", response_model=RadiologyResponse,
            dependencies=[Depends(require_permission("radiology.manage"))])
def update_radiology(radiology_id: int, data: RadiologyUpdate, db: Session = Depends(get_db),
                     payload: dict = Depends(get_current_user_payload)):
    record = RadiologyService.get(db, radiology_id)
    _check_record_access(db, record, payload)
    if payload.get("role") == UserRole.DOCTOR.value:
        doctor = _doctor_for_payload(db, payload)
        if data.doctor_id is not None and data.doctor_id != doctor.id:
            raise HTTPException(status_code=403, detail="You cannot reassign a request to another doctor.")
    return RadiologyService.update(db, radiology_id, data)


@router.delete("/{radiology_id}", status_code=status.HTTP_204_NO_CONTENT,
               dependencies=[Depends(require_permission("radiology.manage"))])
def delete_radiology(radiology_id: int, db: Session = Depends(get_db),
                     payload: dict = Depends(get_current_user_payload)):
    record = RadiologyService.get(db, radiology_id)
    _check_record_access(db, record, payload)
    RadiologyService.delete(db, radiology_id)
    return None
