from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.constants import UserRole
from app.core.database import get_db
from app.core.dependencies import get_current_user_payload, require_permission
from app.models.nurse import Nurse
from app.models.nurse_patient_assignment import NursePatientAssignment
from app.models.nursing_care_plan import NursingCarePlan
from app.schemas.nursing_care_plan import NursingCarePlanCreate, NursingCarePlanResponse, NursingCarePlanUpdate
from app.services.nursing_care_plan_service import (
    cancel_care_plan, complete_care_plan, create_care_plan, delete_care_plan,
    get_care_plan, get_care_plan_by_number, list_care_plans, put_on_hold,
    reactivate_care_plan, update_care_plan,
)

router = APIRouter(prefix="/nursing-care-plans", tags=["Nursing Care Plans"])


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
    exists = db.query(NursePatientAssignment.id).filter(
        NursePatientAssignment.nurse_id == nurse.id,
        NursePatientAssignment.patient_id == patient_id,
        NursePatientAssignment.status == "active",
    ).first()
    if not exists:
        raise HTTPException(status_code=404, detail="Care plan not found for this nursing account.")


def _ensure_plan_access(db: Session, plan: NursingCarePlan, nurse: Nurse | None) -> None:
    if nurse is not None:
        _ensure_assignment(db, nurse, plan.patient_id)


@router.post("", response_model=NursingCarePlanResponse, status_code=status.HTTP_201_CREATED,
             dependencies=[Depends(require_permission("nursing.manage"))])
def create(data: NursingCarePlanCreate, db: Session = Depends(get_db),
           payload: dict = Depends(get_current_user_payload)):
    nurse = _nurse_for_payload(db, payload)
    if nurse is not None:
        _ensure_assignment(db, nurse, data.patient_id)
        data = data.model_copy(update={"nurse_id": nurse.id})
    return create_care_plan(db, data)


@router.get("", response_model=list[NursingCarePlanResponse],
            dependencies=[Depends(require_permission("nursing.view"))])
def list_all(patient_id: int | None = Query(default=None), admission_id: int | None = Query(default=None),
             nurse_id: int | None = Query(default=None), plan_status: str | None = Query(default=None),
             priority: str | None = Query(default=None), db: Session = Depends(get_db),
             payload: dict = Depends(get_current_user_payload)):
    nurse = _nurse_for_payload(db, payload)
    if nurse is None:
        return list_care_plans(db, patient_id=patient_id, admission_id=admission_id,
                               nurse_id=nurse_id, plan_status=plan_status, priority=priority)
    assigned_ids = [r[0] for r in db.query(NursePatientAssignment.patient_id).filter(
        NursePatientAssignment.nurse_id == nurse.id,
        NursePatientAssignment.status == "active").all()]
    if not assigned_ids or (patient_id is not None and patient_id not in assigned_ids):
        return []
    query = select(NursingCarePlan).where(NursingCarePlan.patient_id.in_(assigned_ids))
    if patient_id is not None:
        query = query.where(NursingCarePlan.patient_id == patient_id)
    if admission_id is not None:
        query = query.where(NursingCarePlan.admission_id == admission_id)
    if plan_status is not None:
        query = query.where(NursingCarePlan.status == plan_status)
    if priority is not None:
        query = query.where(NursingCarePlan.priority == priority)
    return list(db.scalars(query.order_by(NursingCarePlan.created_at.desc())).all())


@router.get("/number/{care_plan_number}", response_model=NursingCarePlanResponse,
            dependencies=[Depends(require_permission("nursing.view"))])
def get_by_number(care_plan_number: str, db: Session = Depends(get_db),
                  payload: dict = Depends(get_current_user_payload)):
    plan = get_care_plan_by_number(db, care_plan_number)
    _ensure_plan_access(db, plan, _nurse_for_payload(db, payload))
    return plan


@router.get("/{care_plan_id}", response_model=NursingCarePlanResponse,
            dependencies=[Depends(require_permission("nursing.view"))])
def get_by_id(care_plan_id: int, db: Session = Depends(get_db),
              payload: dict = Depends(get_current_user_payload)):
    plan = get_care_plan(db, care_plan_id)
    _ensure_plan_access(db, plan, _nurse_for_payload(db, payload))
    return plan


@router.put("/{care_plan_id}", response_model=NursingCarePlanResponse,
            dependencies=[Depends(require_permission("nursing.manage"))])
def update(care_plan_id: int, data: NursingCarePlanUpdate, db: Session = Depends(get_db),
           payload: dict = Depends(get_current_user_payload)):
    plan = get_care_plan(db, care_plan_id)
    nurse = _nurse_for_payload(db, payload)
    _ensure_plan_access(db, plan, nurse)
    if nurse is not None:
        new_patient_id = getattr(data, "patient_id", None) or plan.patient_id
        _ensure_assignment(db, nurse, new_patient_id)
        if getattr(data, "nurse_id", None) not in (None, nurse.id):
            raise HTTPException(status_code=403, detail="Nurses cannot reassign care-plan ownership.")
    return update_care_plan(db, care_plan_id, data)


def _change_plan(care_plan_id: int, action, db: Session, payload: dict, **kwargs):
    plan = get_care_plan(db, care_plan_id)
    _ensure_plan_access(db, plan, _nurse_for_payload(db, payload))
    return action(db, care_plan_id, **kwargs)


@router.patch("/{care_plan_id}/complete", response_model=NursingCarePlanResponse,
              dependencies=[Depends(require_permission("nursing.manage"))])
def complete(care_plan_id: int, evaluation: str | None = Query(default=None), db: Session = Depends(get_db),
            payload: dict = Depends(get_current_user_payload)):
    return _change_plan(care_plan_id, complete_care_plan, db, payload, evaluation=evaluation)


@router.patch("/{care_plan_id}/hold", response_model=NursingCarePlanResponse,
              dependencies=[Depends(require_permission("nursing.manage"))])
def hold(care_plan_id: int, db: Session = Depends(get_db), payload: dict = Depends(get_current_user_payload)):
    return _change_plan(care_plan_id, put_on_hold, db, payload)


@router.patch("/{care_plan_id}/reactivate", response_model=NursingCarePlanResponse,
              dependencies=[Depends(require_permission("nursing.manage"))])
def reactivate(care_plan_id: int, db: Session = Depends(get_db), payload: dict = Depends(get_current_user_payload)):
    return _change_plan(care_plan_id, reactivate_care_plan, db, payload)


@router.patch("/{care_plan_id}/cancel", response_model=NursingCarePlanResponse,
              dependencies=[Depends(require_permission("nursing.manage"))])
def cancel(care_plan_id: int, db: Session = Depends(get_db), payload: dict = Depends(get_current_user_payload)):
    return _change_plan(care_plan_id, cancel_care_plan, db, payload)


@router.delete("/{care_plan_id}", status_code=status.HTTP_204_NO_CONTENT,
               dependencies=[Depends(require_permission("nursing.manage"))])
def delete(care_plan_id: int, db: Session = Depends(get_db), payload: dict = Depends(get_current_user_payload)):
    plan = get_care_plan(db, care_plan_id)
    _ensure_plan_access(db, plan, _nurse_for_payload(db, payload))
    delete_care_plan(db, care_plan_id)
    return None
