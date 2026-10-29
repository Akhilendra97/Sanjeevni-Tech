from __future__ import annotations

from datetime import datetime

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.admission import Admission
from app.models.nurse import Nurse
from app.models.nursing_care_plan import NursingCarePlan
from app.models.patient import Patient
from app.schemas.nursing_care_plan import (
    NursingCarePlanCreate,
    NursingCarePlanUpdate,
)


VALID_PRIORITIES = {
    "low",
    "medium",
    "high",
    "critical",
}

VALID_STATUSES = {
    "active",
    "completed",
    "cancelled",
    "on_hold",
}


def _validate_priority(priority: str) -> None:
    if priority not in VALID_PRIORITIES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"Invalid priority. Allowed values: "
                f"{', '.join(sorted(VALID_PRIORITIES))}"
            ),
        )


def _validate_status(plan_status: str) -> None:
    if plan_status not in VALID_STATUSES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"Invalid status. Allowed values: "
                f"{', '.join(sorted(VALID_STATUSES))}"
            ),
        )


def _validate_dates(
    start_date: datetime,
    review_date: datetime | None,
    completed_at: datetime | None,
) -> None:
    if review_date is not None and review_date < start_date:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Review date cannot be earlier than start date.",
        )

    if completed_at is not None and completed_at < start_date:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Completed time cannot be earlier than start date.",
        )


def _validate_patient(
    db: Session,
    patient_id: int,
) -> Patient:
    patient = db.get(Patient, patient_id)

    if patient is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient not found.",
        )

    return patient


def _validate_admission(
    db: Session,
    admission_id: int | None,
    patient_id: int,
) -> Admission | None:
    if admission_id is None:
        return None

    admission = db.get(Admission, admission_id)

    if admission is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Admission not found.",
        )

    if admission.patient_id != patient_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Admission does not belong to the selected patient.",
        )

    return admission


def _validate_nurse(
    db: Session,
    nurse_id: int | None,
) -> Nurse | None:
    if nurse_id is None:
        return None

    nurse = db.get(Nurse, nurse_id)

    if nurse is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Nurse not found.",
        )

    return nurse


def _validate_care_plan_number(
    db: Session,
    care_plan_number: str,
    exclude_id: int | None = None,
) -> None:
    query = select(NursingCarePlan).where(
        NursingCarePlan.care_plan_number == care_plan_number
    )

    if exclude_id is not None:
        query = query.where(
            NursingCarePlan.id != exclude_id
        )

    existing = db.scalar(query)

    if existing is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Care plan number already exists.",
        )


def create_care_plan(
    db: Session,
    data: NursingCarePlanCreate,
) -> NursingCarePlan:
    _validate_priority(data.priority)
    _validate_status(data.status)

    _validate_patient(
        db,
        data.patient_id,
    )

    _validate_admission(
        db,
        data.admission_id,
        data.patient_id,
    )

    _validate_nurse(
        db,
        data.nurse_id,
    )

    _validate_dates(
        data.start_date,
        data.review_date,
        data.completed_at,
    )

    _validate_care_plan_number(
        db,
        data.care_plan_number,
    )

    care_plan = NursingCarePlan(
        **data.model_dump()
    )

    if data.status == "completed" and data.completed_at is None:
        care_plan.completed_at = datetime.utcnow()

    db.add(care_plan)
    db.commit()
    db.refresh(care_plan)

    return care_plan


def get_care_plan(
    db: Session,
    care_plan_id: int,
) -> NursingCarePlan:
    care_plan = db.get(
        NursingCarePlan,
        care_plan_id,
    )

    if care_plan is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Nursing care plan not found.",
        )

    return care_plan


def get_care_plan_by_number(
    db: Session,
    care_plan_number: str,
) -> NursingCarePlan:
    care_plan = db.scalar(
        select(NursingCarePlan).where(
            NursingCarePlan.care_plan_number
            == care_plan_number
        )
    )

    if care_plan is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Nursing care plan not found.",
        )

    return care_plan


def list_care_plans(
    db: Session,
    patient_id: int | None = None,
    admission_id: int | None = None,
    nurse_id: int | None = None,
    plan_status: str | None = None,
    priority: str | None = None,
) -> list[NursingCarePlan]:
    query = select(NursingCarePlan).order_by(
        NursingCarePlan.created_at.desc()
    )

    if patient_id is not None:
        query = query.where(
            NursingCarePlan.patient_id == patient_id
        )

    if admission_id is not None:
        query = query.where(
            NursingCarePlan.admission_id == admission_id
        )

    if nurse_id is not None:
        query = query.where(
            NursingCarePlan.nurse_id == nurse_id
        )

    if plan_status is not None:
        _validate_status(plan_status)
        query = query.where(
            NursingCarePlan.status == plan_status
        )

    if priority is not None:
        _validate_priority(priority)
        query = query.where(
            NursingCarePlan.priority == priority
        )

    return list(db.scalars(query).all())


def update_care_plan(
    db: Session,
    care_plan_id: int,
    data: NursingCarePlanUpdate,
) -> NursingCarePlan:
    care_plan = get_care_plan(
        db,
        care_plan_id,
    )

    values = data.model_dump(
        exclude_unset=True
    )

    new_patient_id = values.get(
        "patient_id",
        care_plan.patient_id,
    )

    new_admission_id = values.get(
        "admission_id",
        care_plan.admission_id,
    )

    if "priority" in values and values["priority"] is not None:
        _validate_priority(values["priority"])

    if "status" in values and values["status"] is not None:
        _validate_status(values["status"])

    if "care_plan_number" in values:
        _validate_care_plan_number(
            db,
            values["care_plan_number"],
            exclude_id=care_plan.id,
        )

    if "patient_id" in values:
        _validate_patient(
            db,
            new_patient_id,
        )

    if (
        "patient_id" in values
        or "admission_id" in values
    ):
        _validate_admission(
            db,
            new_admission_id,
            new_patient_id,
        )

    if "nurse_id" in values:
        _validate_nurse(
            db,
            values["nurse_id"],
        )

    new_start_date = values.get(
        "start_date",
        care_plan.start_date,
    )

    new_review_date = values.get(
        "review_date",
        care_plan.review_date,
    )

    new_completed_at = values.get(
        "completed_at",
        care_plan.completed_at,
    )

    _validate_dates(
        new_start_date,
        new_review_date,
        new_completed_at,
    )

    for field, value in values.items():
        setattr(
            care_plan,
            field,
            value,
        )

    if (
        values.get("status") == "completed"
        and care_plan.completed_at is None
    ):
        care_plan.completed_at = datetime.utcnow()

    db.commit()
    db.refresh(care_plan)

    return care_plan


def complete_care_plan(
    db: Session,
    care_plan_id: int,
    evaluation: str | None = None,
) -> NursingCarePlan:
    care_plan = get_care_plan(
        db,
        care_plan_id,
    )

    if care_plan.status == "cancelled":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cancelled care plan cannot be completed.",
        )

    care_plan.status = "completed"
    care_plan.completed_at = datetime.utcnow()

    if evaluation is not None:
        care_plan.evaluation = evaluation

    db.commit()
    db.refresh(care_plan)

    return care_plan


def put_on_hold(
    db: Session,
    care_plan_id: int,
) -> NursingCarePlan:
    care_plan = get_care_plan(
        db,
        care_plan_id,
    )

    if care_plan.status == "completed":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Completed care plan cannot be put on hold.",
        )

    if care_plan.status == "cancelled":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cancelled care plan cannot be put on hold.",
        )

    care_plan.status = "on_hold"

    db.commit()
    db.refresh(care_plan)

    return care_plan


def reactivate_care_plan(
    db: Session,
    care_plan_id: int,
) -> NursingCarePlan:
    care_plan = get_care_plan(
        db,
        care_plan_id,
    )

    if care_plan.status == "completed":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Completed care plan cannot be reactivated.",
        )

    if care_plan.status == "cancelled":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cancelled care plan cannot be reactivated.",
        )

    care_plan.status = "active"

    db.commit()
    db.refresh(care_plan)

    return care_plan


def cancel_care_plan(
    db: Session,
    care_plan_id: int,
) -> NursingCarePlan:
    care_plan = get_care_plan(
        db,
        care_plan_id,
    )

    if care_plan.status == "completed":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Completed care plan cannot be cancelled.",
        )

    care_plan.status = "cancelled"

    db.commit()
    db.refresh(care_plan)

    return care_plan


def delete_care_plan(
    db: Session,
    care_plan_id: int,
) -> None:
    care_plan = get_care_plan(
        db,
        care_plan_id,
    )

    db.delete(care_plan)
    db.commit()
