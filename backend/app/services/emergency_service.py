from datetime import datetime

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.doctor import Doctor
from app.models.emergency import Emergency
from app.models.patient import Patient
from app.models.user import User
from app.schemas.emergency import EmergencyCreate, EmergencyUpdate


def create_emergency(
    db: Session,
    emergency_data: EmergencyCreate,
) -> Emergency:
    existing = db.scalar(
        select(Emergency).where(
            Emergency.emergency_number
            == emergency_data.emergency_number
        )
    )

    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Emergency number already exists",
        )

    patient = db.scalar(
        select(Patient).where(
            Patient.id == emergency_data.patient_id
        )
    )

    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient not found",
        )

    if emergency_data.doctor_id is not None:
        doctor = db.scalar(
            select(Doctor).where(
                Doctor.id == emergency_data.doctor_id
            )
        )

        if not doctor:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Doctor not found",
            )

    if emergency_data.registered_by is not None:
        user = db.scalar(
            select(User).where(
                User.id == emergency_data.registered_by
            )
        )

        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Registering user not found",
            )

    emergency = Emergency(
        emergency_number=emergency_data.emergency_number,
        patient_id=emergency_data.patient_id,
        doctor_id=emergency_data.doctor_id,
        registered_by=emergency_data.registered_by,
        arrival_time=emergency_data.arrival_time,
        triage_level=emergency_data.triage_level,
        chief_complaint=emergency_data.chief_complaint,
        symptoms=emergency_data.symptoms,
        initial_assessment=emergency_data.initial_assessment,
        treatment=emergency_data.treatment,
        status=emergency_data.status,
        disposition=emergency_data.disposition,
        discharge_time=emergency_data.discharge_time,
        notes=emergency_data.notes,
    )

    db.add(emergency)
    db.commit()
    db.refresh(emergency)

    return emergency


def get_emergency(
    db: Session,
    emergency_id: int,
) -> Emergency:
    emergency = db.scalar(
        select(Emergency).where(
            Emergency.id == emergency_id
        )
    )

    if not emergency:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Emergency record not found",
        )

    return emergency


def get_emergency_by_number(
    db: Session,
    emergency_number: str,
) -> Emergency:
    emergency = db.scalar(
        select(Emergency).where(
            Emergency.emergency_number
            == emergency_number
        )
    )

    if not emergency:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Emergency record not found",
        )

    return emergency


def list_emergencies(
    db: Session,
    patient_id: int | None = None,
    doctor_id: int | None = None,
    status_value: str | None = None,
    triage_level: str | None = None,
) -> list[Emergency]:
    query = select(Emergency)

    if patient_id is not None:
        query = query.where(
            Emergency.patient_id == patient_id
        )

    if doctor_id is not None:
        query = query.where(
            Emergency.doctor_id == doctor_id
        )

    if status_value is not None:
        query = query.where(
            Emergency.status == status_value
        )

    if triage_level is not None:
        query = query.where(
            Emergency.triage_level == triage_level
        )

    query = query.order_by(
        Emergency.arrival_time.desc(),
        Emergency.id.desc(),
    )

    return list(
        db.scalars(query).all()
    )


def update_emergency(
    db: Session,
    emergency_id: int,
    emergency_data: EmergencyUpdate,
) -> Emergency:
    emergency = get_emergency(
        db,
        emergency_id,
    )

    update_data = emergency_data.model_dump(
        exclude_unset=True
    )

    if "doctor_id" in update_data:
        doctor_id = update_data["doctor_id"]

        if doctor_id is not None:
            doctor = db.scalar(
                select(Doctor).where(
                    Doctor.id == doctor_id
                )
            )

            if not doctor:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Doctor not found",
                )

    if "registered_by" in update_data:
        registered_by = update_data["registered_by"]

        if registered_by is not None:
            user = db.scalar(
                select(User).where(
                    User.id == registered_by
                )
            )

            if not user:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Registering user not found",
                )

    for field, value in update_data.items():
        setattr(emergency, field, value)

    db.commit()
    db.refresh(emergency)

    return emergency


def delete_emergency(
    db: Session,
    emergency_id: int,
) -> None:
    emergency = get_emergency(
        db,
        emergency_id,
    )

    db.delete(emergency)
    db.commit()
