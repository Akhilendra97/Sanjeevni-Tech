from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.constants import UserRole
from app.core.database import get_db
from app.core.dependencies import get_current_user_payload, require_permission
from app.models.nurse import Nurse
from app.models.nurse_patient_assignment import NursePatientAssignment
from app.models.nursing import NursingNote
from app.schemas.nursing import NursingNoteCreate, NursingNoteResponse, NursingNoteUpdate
from app.services.nursing_service import (
    create_nursing_note, delete_nursing_note, get_nursing_note_by_id,
    list_nursing_notes, update_nursing_note,
)

router = APIRouter(prefix="/nursing-notes", tags=["Nursing Notes"])


def _nurse_for_payload(db: Session, payload: dict) -> Nurse | None:
    if payload.get("role") != UserRole.NURSE.value:
        return None
    try:
        user_id = int(payload.get("sub"))
    except (TypeError, ValueError):
        raise HTTPException(status_code=401, detail="Invalid authenticated user.")
    nurse = db.query(Nurse).filter(Nurse.user_id == user_id).first()
    if nurse is None:
        raise HTTPException(status_code=404, detail="Nurse profile is not linked to this account.")
    return nurse


def _ensure_assignment(db: Session, nurse: Nurse, patient_id: int) -> None:
    assigned = db.query(NursePatientAssignment.id).filter(
        NursePatientAssignment.nurse_id == nurse.id,
        NursePatientAssignment.patient_id == patient_id,
        NursePatientAssignment.status == "active",
    ).first()
    if not assigned:
        raise HTTPException(status_code=404, detail="Nursing note not found for this nursing account.")


def _ensure_note_access(db: Session, note: NursingNote, nurse: Nurse | None) -> None:
    if nurse is not None:
        if note.nurse_id != nurse.id:
            raise HTTPException(status_code=404, detail="Nursing note not found.")
        _ensure_assignment(db, nurse, note.patient_id)


@router.post("", response_model=NursingNoteResponse, status_code=status.HTTP_201_CREATED,
             dependencies=[Depends(require_permission("nursing.manage"))])
def create(request: NursingNoteCreate, db: Session = Depends(get_db),
           payload: dict = Depends(get_current_user_payload)) -> NursingNote:
    nurse = _nurse_for_payload(db, payload)
    nurse_id = request.nurse_id
    if nurse is not None:
        _ensure_assignment(db, nurse, request.patient_id)
        nurse_id = nurse.id  # Never trust client-supplied nurse_id for a nurse account.
    return create_nursing_note(db, nurse_id=nurse_id, patient_id=request.patient_id,
                               note_type=request.note_type, subject=request.subject, note=request.note)


@router.get("", response_model=list[NursingNoteResponse],
            dependencies=[Depends(require_permission("nursing.view"))])
def get_all(db: Session = Depends(get_db),
            payload: dict = Depends(get_current_user_payload)) -> list[NursingNote]:
    nurse = _nurse_for_payload(db, payload)
    if nurse is None:
        return list_nursing_notes(db)
    assigned_ids = [row[0] for row in db.query(NursePatientAssignment.patient_id).filter(
        NursePatientAssignment.nurse_id == nurse.id,
        NursePatientAssignment.status == "active").all()]
    if not assigned_ids:
        return []
    return db.query(NursingNote).filter(
        NursingNote.nurse_id == nurse.id,
        NursingNote.patient_id.in_(assigned_ids),
    ).order_by(NursingNote.created_at.desc()).all()


@router.get("/{nursing_note_id}", response_model=NursingNoteResponse,
            dependencies=[Depends(require_permission("nursing.view"))])
def get_one(nursing_note_id: int, db: Session = Depends(get_db),
            payload: dict = Depends(get_current_user_payload)) -> NursingNote:
    note = get_nursing_note_by_id(db, nursing_note_id)
    if note is None:
        raise HTTPException(status_code=404, detail="Nursing note not found.")
    _ensure_note_access(db, note, _nurse_for_payload(db, payload))
    return note


@router.patch("/{nursing_note_id}", response_model=NursingNoteResponse,
              dependencies=[Depends(require_permission("nursing.manage"))])
def update(nursing_note_id: int, request: NursingNoteUpdate, db: Session = Depends(get_db),
           payload: dict = Depends(get_current_user_payload)) -> NursingNote:
    note = get_nursing_note_by_id(db, nursing_note_id)
    if note is None:
        raise HTTPException(status_code=404, detail="Nursing note not found.")
    _ensure_note_access(db, note, _nurse_for_payload(db, payload))
    return update_nursing_note(db, note, note_type=request.note_type,
                               subject=request.subject, note=request.note)


@router.delete("/{nursing_note_id}", status_code=status.HTTP_204_NO_CONTENT,
               dependencies=[Depends(require_permission("nursing.manage"))])
def delete(nursing_note_id: int, db: Session = Depends(get_db),
           payload: dict = Depends(get_current_user_payload)) -> None:
    note = get_nursing_note_by_id(db, nursing_note_id)
    if note is None:
        raise HTTPException(status_code=404, detail="Nursing note not found.")
    _ensure_note_access(db, note, _nurse_for_payload(db, payload))
    delete_nursing_note(db, note)
