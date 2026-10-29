from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session, joinedload

from app.core.constants import UserRole
from app.core.database import get_db
from app.core.dependencies import get_current_user_payload, require_permission
from app.models.nurse import Nurse
from app.models.patient import Patient
from app.models.prescription import Prescription
from app.models.nursing import NursingNote
from app.models.nursing_care_plan import NursingCarePlan
from app.models.nurse_patient_assignment import NursePatientAssignment

router = APIRouter(prefix="/nurse-workspace", tags=["Nurse Workspace"])


def _user_id(payload: dict) -> int:
    try:
        return int(payload.get("sub"))
    except (TypeError, ValueError):
        raise HTTPException(status_code=401, detail="Invalid authenticated user.")


def _current_nurse(db: Session, payload: dict) -> Nurse:
    if payload.get("role") != UserRole.NURSE.value:
        raise HTTPException(status_code=403, detail="Nurse account required.")
    nurse = db.query(Nurse).filter(Nurse.user_id == _user_id(payload)).first()
    if not nurse:
        raise HTTPException(status_code=404, detail="Nurse profile is not linked to this account.")
    return nurse


def _assigned_patient_ids(db: Session, nurse_id: int) -> list[int]:
    return [r[0] for r in db.query(NursePatientAssignment.patient_id).filter(
        NursePatientAssignment.nurse_id == nurse_id,
        NursePatientAssignment.status == "active",
    ).all()]


@router.get("/assigned-patients")
def assigned_patients(search: str | None = Query(default=None, max_length=120),
                      payload: dict = Depends(get_current_user_payload), db: Session = Depends(get_db)):
    nurse = _current_nurse(db, payload)
    query = db.query(Patient).join(NursePatientAssignment, NursePatientAssignment.patient_id == Patient.id).filter(
        NursePatientAssignment.nurse_id == nurse.id,
        NursePatientAssignment.status == "active",
        Patient.is_active.is_(True),
    )
    if search and search.strip():
        term = f"%{search.strip()}%"
        query = query.filter((Patient.first_name.ilike(term)) | (Patient.last_name.ilike(term)) | (Patient.patient_number.ilike(term)))
    patients = query.order_by(Patient.last_name, Patient.first_name).all()
    return [{"id": p.id, "patient_number": p.patient_number, "first_name": p.first_name,
             "middle_name": p.middle_name, "last_name": p.last_name, "full_name": p.display_name,
             "gender": p.gender, "is_active": p.is_active, "assignment_status": "active"} for p in patients]


@router.get("/medication-schedule")
def medication_schedule(payload: dict = Depends(get_current_user_payload), db: Session = Depends(get_db)):
    nurse = _current_nurse(db, payload)
    ids = _assigned_patient_ids(db, nurse.id)
    if not ids:
        return []
    rows = db.query(Prescription).options(joinedload(Prescription.patient)).filter(Prescription.patient_id.in_(ids)).order_by(Prescription.prescription_date.desc(), Prescription.id.desc()).all()
    return [{"id": r.id, "prescription_number": r.prescription_number, "patient_id": r.patient_id,
             "patient_name": r.patient.display_name if r.patient else None,
             "doctor_id": r.doctor_id, "prescription_date": r.prescription_date,
             "diagnosis": r.diagnosis, "medicines": r.medicines, "instructions": r.instructions,
             "duration": r.duration, "follow_up_date": r.follow_up_date, "notes": r.notes} for r in rows]


@router.get("/nursing-notes")
def nursing_notes(payload: dict = Depends(get_current_user_payload), db: Session = Depends(get_db)):
    nurse = _current_nurse(db, payload)
    ids = _assigned_patient_ids(db, nurse.id)
    if not ids:
        return []
    rows = db.query(NursingNote).filter(NursingNote.nurse_id == nurse.id, NursingNote.patient_id.in_(ids)).order_by(NursingNote.created_at.desc()).all()
    return [{"id": r.id, "nurse_id": r.nurse_id, "patient_id": r.patient_id, "note_type": r.note_type,
             "subject": r.subject, "note": r.note, "created_at": r.created_at, "updated_at": r.updated_at,
             "patient_name": r.patient.display_name if r.patient else None} for r in rows]


@router.get("/care-plans")
def care_plans(payload: dict = Depends(get_current_user_payload), db: Session = Depends(get_db)):
    nurse = _current_nurse(db, payload)
    ids = _assigned_patient_ids(db, nurse.id)
    if not ids:
        return []
    rows = db.query(NursingCarePlan).filter(NursingCarePlan.nurse_id == nurse.id, NursingCarePlan.patient_id.in_(ids)).order_by(NursingCarePlan.created_at.desc()).all()
    return [{"id": r.id, "care_plan_number": r.care_plan_number, "patient_id": r.patient_id,
             "admission_id": r.admission_id, "nurse_id": r.nurse_id, "assessment": r.assessment,
             "nursing_diagnosis": r.nursing_diagnosis, "goals": r.goals, "interventions": r.interventions,
             "expected_outcome": r.expected_outcome, "evaluation": r.evaluation, "priority": r.priority,
             "status": r.status, "start_date": r.start_date, "review_date": r.review_date,
             "completed_at": r.completed_at, "notes": r.notes,
             "patient_name": r.patient.display_name if r.patient else None,
             "nurse_name": r.nurse.full_name if r.nurse else None,
             "nurse_employee_id": r.nurse.employee_id if r.nurse else None} for r in rows]


class AssignmentCreate(BaseModel):
    nurse_id: int = Field(gt=0)
    patient_id: int = Field(gt=0)


@router.post("/assignments", status_code=status.HTTP_201_CREATED,
             dependencies=[Depends(require_permission("nursing.manage"))])
def create_assignment(data: AssignmentCreate, payload: dict = Depends(get_current_user_payload), db: Session = Depends(get_db)):
    nurse = db.get(Nurse, data.nurse_id)
    patient = db.get(Patient, data.patient_id)
    if not nurse:
        raise HTTPException(status_code=404, detail="Nurse profile not found.")
    if not patient or not patient.is_active:
        raise HTTPException(status_code=404, detail="Active patient not found.")
    # The pair is unique even when an earlier assignment is inactive. Reactivate
    # the existing row to preserve history and avoid a duplicate-key violation.
    existing = db.query(NursePatientAssignment).filter(
        NursePatientAssignment.nurse_id == data.nurse_id,
        NursePatientAssignment.patient_id == data.patient_id,
    ).first()
    if existing:
        if existing.status == "active":
            return {"id": existing.id, "nurse_id": existing.nurse_id, "patient_id": existing.patient_id, "status": existing.status, "message": "Assignment already active."}
        existing.status = "active"
        existing.ended_at = None
        existing.assigned_by_user_id = _user_id(payload)
        db.commit()
        db.refresh(existing)
        return {"id": existing.id, "nurse_id": existing.nurse_id, "patient_id": existing.patient_id, "status": existing.status, "message": "Previous assignment reactivated."}
    row = NursePatientAssignment(nurse_id=data.nurse_id, patient_id=data.patient_id,
                                 status="active", assigned_by_user_id=_user_id(payload))
    db.add(row)
    db.commit()
    db.refresh(row)
    return {"id": row.id, "nurse_id": row.nurse_id, "patient_id": row.patient_id, "status": row.status}


@router.get("/assignments", dependencies=[Depends(require_permission("nursing.view"))])
def list_assignments(nurse_id: int | None = None, payload: dict = Depends(get_current_user_payload), db: Session = Depends(get_db)):
    q = db.query(NursePatientAssignment).filter(NursePatientAssignment.status == "active")
    if payload.get("role") == UserRole.NURSE.value:
        own_nurse = _current_nurse(db, payload)
        q = q.filter(NursePatientAssignment.nurse_id == own_nurse.id)
    elif nurse_id is not None:
        q = q.filter(NursePatientAssignment.nurse_id == nurse_id)
    return [{"id": r.id, "nurse_id": r.nurse_id, "patient_id": r.patient_id, "status": r.status, "assigned_at": r.assigned_at} for r in q.order_by(NursePatientAssignment.id.desc()).all()]

class NursingNoteCreatePayload(BaseModel):
    patient_id: int = Field(gt=0)
    note_type: str = Field(default="general", min_length=1, max_length=50)
    subject: str | None = Field(default=None, max_length=255)
    note: str = Field(min_length=1)


class NursingNoteUpdatePayload(BaseModel):
    note_type: str | None = Field(default=None, min_length=1, max_length=50)
    subject: str | None = Field(default=None, max_length=255)
    note: str | None = Field(default=None, min_length=1)


def _require_assignment(db: Session, nurse_id: int, patient_id: int) -> None:
    found = db.query(NursePatientAssignment.id).filter(
        NursePatientAssignment.nurse_id == nurse_id,
        NursePatientAssignment.patient_id == patient_id,
        NursePatientAssignment.status == "active",
    ).first()
    if not found:
        raise HTTPException(status_code=403, detail="This patient is not assigned to your nursing account.")


@router.post("/nursing-notes", status_code=status.HTTP_201_CREATED)
def create_own_nursing_note(data: NursingNoteCreatePayload, payload: dict = Depends(get_current_user_payload), db: Session = Depends(get_db)):
    nurse = _current_nurse(db, payload)
    _require_assignment(db, nurse.id, data.patient_id)
    row = NursingNote(nurse_id=nurse.id, patient_id=data.patient_id, note_type=data.note_type,
                      subject=data.subject, note=data.note.strip())
    db.add(row)
    db.commit()
    db.refresh(row)
    return {"id": row.id, "nurse_id": row.nurse_id, "patient_id": row.patient_id,
            "note_type": row.note_type, "subject": row.subject, "note": row.note,
            "created_at": row.created_at, "updated_at": row.updated_at}


@router.patch("/nursing-notes/{note_id}")
def update_own_nursing_note(note_id: int, data: NursingNoteUpdatePayload, payload: dict = Depends(get_current_user_payload), db: Session = Depends(get_db)):
    nurse = _current_nurse(db, payload)
    row = db.query(NursingNote).filter(NursingNote.id == note_id, NursingNote.nurse_id == nurse.id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Nursing note not found for this account.")
    _require_assignment(db, nurse.id, row.patient_id)
    for field in ("note_type", "subject", "note"):
        value = getattr(data, field)
        if value is not None:
            setattr(row, field, value.strip() if isinstance(value, str) else value)
    db.commit()
    db.refresh(row)
    return {"id": row.id, "nurse_id": row.nurse_id, "patient_id": row.patient_id,
            "note_type": row.note_type, "subject": row.subject, "note": row.note,
            "created_at": row.created_at, "updated_at": row.updated_at}


@router.delete("/nursing-notes/{note_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_own_nursing_note(note_id: int, payload: dict = Depends(get_current_user_payload), db: Session = Depends(get_db)):
    nurse = _current_nurse(db, payload)
    row = db.query(NursingNote).filter(NursingNote.id == note_id, NursingNote.nurse_id == nurse.id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Nursing note not found for this account.")
    _require_assignment(db, nurse.id, row.patient_id)
    db.delete(row)
    db.commit()
