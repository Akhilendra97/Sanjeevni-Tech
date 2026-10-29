from __future__ import annotations

from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.emergency import Emergency
from app.models.patient import Patient
from app.models.triage import Triage
from app.models.user import User
from app.schemas.triage import TriageCreate, TriageUpdate


VALID_TRIAGE_LEVELS = {
    "resuscitation",
    "emergency",
    "urgent",
    "semi_urgent",
    "non_urgent",
}

VALID_STATUSES = {
    "active",
    "reassessed",
    "completed",
    "cancelled",
}


def _validate_triage_level(triage_level: str) -> None:
    if triage_level not in VALID_TRIAGE_LEVELS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"Invalid triage level. Allowed values: "
                f"{', '.join(sorted(VALID_TRIAGE_LEVELS))}"
            ),
        )


def _validate_status(triage_status: str) -> None:
    if triage_status not in VALID_STATUSES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"Invalid triage status. Allowed values: "
                f"{', '.join(sorted(VALID_STATUSES))}"
            ),
        )


def _validate_vitals(data) -> None:
    if data.pain_score is not None and not 0 <= data.pain_score <= 10:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Pain score must be between 0 and 10.",
        )

    if (
        data.oxygen_saturation is not None
        and not 0 <= data.oxygen_saturation <= 100
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Oxygen saturation must be between 0 and 100.",
        )

    numeric_fields = {
        "heart_rate": data.heart_rate,
        "respiratory_rate": data.respiratory_rate,
        "systolic_bp": data.systolic_bp,
        "diastolic_bp": data.diastolic_bp,
    }

    for field_name, value in numeric_fields.items():
        if value is not None and value < 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"{field_name} cannot be negative.",
            )


def _get_patient(db: Session, patient_id: int) -> Patient:
    patient = db.get(Patient, patient_id)

    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient not found.",
        )

    return patient


def _get_emergency(db: Session, emergency_id: int) -> Emergency:
    emergency = db.get(Emergency, emergency_id)

    if not emergency:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Emergency record not found.",
        )

    return emergency


def _get_user(db: Session, user_id: int) -> User:
    user = db.get(User, user_id)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assessed-by user not found.",
        )

    return user


def _validate_patient_emergency_consistency(
    patient_id: int,
    emergency: Emergency,
) -> None:
    if emergency.patient_id != patient_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Emergency record does not belong to the selected patient.",
        )


def create_triage(
    db: Session,
    data: TriageCreate,
) -> Triage:
    existing = db.scalar(
        select(Triage).where(
            Triage.triage_number == data.triage_number
        )
    )

    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Triage number already exists.",
        )

    _validate_triage_level(data.triage_level)
    _validate_status(data.status)
    _validate_vitals(data)

    emergency = _get_emergency(db, data.emergency_id)
    _get_patient(db, data.patient_id)

    _validate_patient_emergency_consistency(
        data.patient_id,
        emergency,
    )

    if data.assessed_by is not None:
        _get_user(db, data.assessed_by)

    triage = Triage(**data.model_dump())

    db.add(triage)
    db.commit()
    db.refresh(triage)

    return triage


def get_triage(
    db: Session,
    triage_id: int,
) -> Triage:
    triage = db.get(Triage, triage_id)

    if not triage:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Triage record not found.",
        )

    return triage


def get_triage_by_number(
    db: Session,
    triage_number: str,
) -> Triage:
    triage = db.scalar(
        select(Triage).where(
            Triage.triage_number == triage_number
        )
    )

    if not triage:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Triage record not found.",
        )

    return triage


def list_triages(
    db: Session,
    patient_id: int | None = None,
    emergency_id: int | None = None,
    triage_level: str | None = None,
    triage_status: str | None = None,
    skip: int = 0,
    limit: int = 100,
) -> list[Triage]:
    statement = select(Triage).order_by(
        Triage.priority_score.desc(),
        Triage.assessed_at.asc(),
    )

    if patient_id is not None:
        statement = statement.where(
            Triage.patient_id == patient_id
        )

    if emergency_id is not None:
        statement = statement.where(
            Triage.emergency_id == emergency_id
        )

    if triage_level is not None:
        _validate_triage_level(triage_level)
        statement = statement.where(
            Triage.triage_level == triage_level
        )

    if triage_status is not None:
        _validate_status(triage_status)
        statement = statement.where(
            Triage.status == triage_status
        )

    statement = statement.offset(skip).limit(limit)

    return list(db.scalars(statement).all())


def update_triage(
    db: Session,
    triage_id: int,
    data: TriageUpdate,
) -> Triage:
    triage = get_triage(db, triage_id)

    update_data = data.model_dump(exclude_unset=True)

    if "triage_level" in update_data:
        _validate_triage_level(update_data["triage_level"])

    if "status" in update_data:
        _validate_status(update_data["status"])

    if "assessed_by" in update_data:
        if update_data["assessed_by"] is not None:
            _get_user(db, update_data["assessed_by"])

    for field_name, value in update_data.items():
        if field_name == "pain_score" and value is not None:
            if not 0 <= value <= 10:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Pain score must be between 0 and 10.",
                )

        if field_name == "oxygen_saturation" and value is not None:
            if not 0 <= value <= 100:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Oxygen saturation must be between 0 and 100.",
                )

        if field_name in {
            "heart_rate",
            "respiratory_rate",
            "systolic_bp",
            "diastolic_bp",
            "priority_score",
        }:
            if value is not None and value < 0:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"{field_name} cannot be negative.",
                )

        setattr(triage, field_name, value)

    if update_data:
        triage.updated_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(triage)

    return triage


def reassess_triage(
    db: Session,
    triage_id: int,
    data: TriageUpdate,
) -> Triage:
    triage = get_triage(db, triage_id)

    update_data = data.model_dump(exclude_unset=True)

    if "triage_level" in update_data:
        _validate_triage_level(update_data["triage_level"])

    if "status" in update_data:
        _validate_status(update_data["status"])
    else:
        update_data["status"] = "reassessed"

    if "assessed_by" in update_data:
        if update_data["assessed_by"] is not None:
            _get_user(db, update_data["assessed_by"])

    for field_name, value in update_data.items():
        setattr(triage, field_name, value)

    triage.reassessed_at = datetime.now(timezone.utc)
    triage.updated_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(triage)

    return triage


def complete_triage(
    db: Session,
    triage_id: int,
) -> Triage:
    triage = get_triage(db, triage_id)

    if triage.status == "cancelled":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cancelled triage cannot be completed.",
        )

    triage.status = "completed"
    triage.updated_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(triage)

    return triage


def cancel_triage(
    db: Session,
    triage_id: int,
) -> Triage:
    triage = get_triage(db, triage_id)

    if triage.status == "completed":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Completed triage cannot be cancelled.",
        )

    triage.status = "cancelled"
    triage.updated_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(triage)

    return triage


def delete_triage(
    db: Session,
    triage_id: int,
) -> None:
    triage = get_triage(db, triage_id)

    db.delete(triage)
    db.commit()
