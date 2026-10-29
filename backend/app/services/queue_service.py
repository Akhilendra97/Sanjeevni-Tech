from __future__ import annotations

from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.appointment import Appointment
from app.models.department import Department
from app.models.doctor import Doctor
from app.models.emergency import Emergency
from app.models.patient import Patient
from app.models.queue import Queue
from app.schemas.queue import QueueCreate, QueueUpdate


VALID_QUEUE_TYPES = {
    "opd",
    "emergency",
    "follow_up",
    "diagnostic",
    "pharmacy",
}

VALID_STATUSES = {
    "waiting",
    "called",
    "in_service",
    "completed",
    "cancelled",
    "no_show",
}


def _validate_queue_type(queue_type: str) -> None:
    if queue_type not in VALID_QUEUE_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"Invalid queue type. Allowed values: "
                f"{', '.join(sorted(VALID_QUEUE_TYPES))}"
            ),
        )


def _validate_status(queue_status: str) -> None:
    if queue_status not in VALID_STATUSES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"Invalid queue status. Allowed values: "
                f"{', '.join(sorted(VALID_STATUSES))}"
            ),
        )


def _get_patient(db: Session, patient_id: int) -> Patient:
    patient = db.get(Patient, patient_id)

    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient not found.",
        )

    return patient


def _get_appointment(
    db: Session,
    appointment_id: int,
) -> Appointment:
    appointment = db.get(Appointment, appointment_id)

    if not appointment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Appointment not found.",
        )

    return appointment


def _get_emergency(
    db: Session,
    emergency_id: int,
) -> Emergency:
    emergency = db.get(Emergency, emergency_id)

    if not emergency:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Emergency record not found.",
        )

    return emergency


def _get_doctor(
    db: Session,
    doctor_id: int,
) -> Doctor:
    doctor = db.get(Doctor, doctor_id)

    if not doctor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Doctor not found.",
        )

    return doctor


def _get_department(
    db: Session,
    department_id: int,
) -> Department:
    department = db.get(Department, department_id)

    if not department:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Department not found.",
        )

    return department


def _validate_reference_consistency(
    patient_id: int,
    appointment: Appointment | None,
    emergency: Emergency | None,
) -> None:
    if appointment is not None:
        if appointment.patient_id != patient_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Appointment does not belong to the selected patient.",
            )

    if emergency is not None:
        if emergency.patient_id != patient_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Emergency record does not belong to the selected patient.",
            )


def _validate_time_order(
    called_at: datetime | None,
    service_start_time: datetime | None,
    service_end_time: datetime | None,
) -> None:
    if (
        called_at is not None
        and service_start_time is not None
        and service_start_time < called_at
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Service start time cannot be before called time.",
        )

    if (
        service_start_time is not None
        and service_end_time is not None
        and service_end_time < service_start_time
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Service end time cannot be before service start time.",
        )


def create_queue(
    db: Session,
    data: QueueCreate,
) -> Queue:
    existing = db.scalar(
        select(Queue).where(
            Queue.queue_number == data.queue_number
        )
    )

    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Queue number already exists.",
        )

    _validate_queue_type(data.queue_type)
    _validate_status(data.status)

    if data.token_number < 1:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Token number must be greater than zero.",
        )

    _get_patient(db, data.patient_id)
    _get_department(db, data.department_id)

    appointment = None
    emergency = None

    if data.appointment_id is not None:
        appointment = _get_appointment(
            db,
            data.appointment_id,
        )

    if data.emergency_id is not None:
        emergency = _get_emergency(
            db,
            data.emergency_id,
        )

    if data.doctor_id is not None:
        _get_doctor(
            db,
            data.doctor_id,
        )

    _validate_reference_consistency(
        data.patient_id,
        appointment,
        emergency,
    )

    _validate_time_order(
        data.called_at,
        data.service_start_time,
        data.service_end_time,
    )

    queue = Queue(**data.model_dump())

    db.add(queue)
    db.commit()
    db.refresh(queue)

    return queue


def get_queue(
    db: Session,
    queue_id: int,
) -> Queue:
    queue = db.get(Queue, queue_id)

    if not queue:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Queue entry not found.",
        )

    return queue


def get_queue_by_number(
    db: Session,
    queue_number: str,
) -> Queue:
    queue = db.scalar(
        select(Queue).where(
            Queue.queue_number == queue_number
        )
    )

    if not queue:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Queue entry not found.",
        )

    return queue


def list_queues(
    db: Session,
    patient_id: int | None = None,
    doctor_id: int | None = None,
    department_id: int | None = None,
    queue_type: str | None = None,
    queue_status: str | None = None,
    skip: int = 0,
    limit: int = 100,
) -> list[Queue]:
    statement = select(Queue).order_by(
        Queue.priority.desc(),
        Queue.check_in_time.asc(),
    )

    if patient_id is not None:
        statement = statement.where(
            Queue.patient_id == patient_id
        )

    if doctor_id is not None:
        statement = statement.where(
            Queue.doctor_id == doctor_id
        )

    if department_id is not None:
        statement = statement.where(
            Queue.department_id == department_id
        )

    if queue_type is not None:
        _validate_queue_type(queue_type)
        statement = statement.where(
            Queue.queue_type == queue_type
        )

    if queue_status is not None:
        _validate_status(queue_status)
        statement = statement.where(
            Queue.status == queue_status
        )

    statement = statement.offset(skip).limit(limit)

    return list(db.scalars(statement).all())


def update_queue(
    db: Session,
    queue_id: int,
    data: QueueUpdate,
) -> Queue:
    queue = get_queue(db, queue_id)

    update_data = data.model_dump(exclude_unset=True)

    if "queue_type" in update_data:
        _validate_queue_type(update_data["queue_type"])

    if "status" in update_data:
        _validate_status(update_data["status"])

    if (
        "token_number" in update_data
        and update_data["token_number"] is not None
        and update_data["token_number"] < 1
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Token number must be greater than zero.",
        )

    patient_id = update_data.get(
        "patient_id",
        queue.patient_id,
    )

    appointment_id = update_data.get(
        "appointment_id",
        queue.appointment_id,
    )

    emergency_id = update_data.get(
        "emergency_id",
        queue.emergency_id,
    )

    department_id = update_data.get(
        "department_id",
        queue.department_id,
    )

    doctor_id = update_data.get(
        "doctor_id",
        queue.doctor_id,
    )

    _get_patient(db, patient_id)
    _get_department(db, department_id)

    appointment = None
    emergency = None

    if appointment_id is not None:
        appointment = _get_appointment(
            db,
            appointment_id,
        )

    if emergency_id is not None:
        emergency = _get_emergency(
            db,
            emergency_id,
        )

    if doctor_id is not None:
        _get_doctor(
            db,
            doctor_id,
        )

    _validate_reference_consistency(
        patient_id,
        appointment,
        emergency,
    )

    called_at = update_data.get(
        "called_at",
        queue.called_at,
    )

    service_start_time = update_data.get(
        "service_start_time",
        queue.service_start_time,
    )

    service_end_time = update_data.get(
        "service_end_time",
        queue.service_end_time,
    )

    _validate_time_order(
        called_at,
        service_start_time,
        service_end_time,
    )

    for field_name, value in update_data.items():
        setattr(queue, field_name, value)

    queue.updated_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(queue)

    return queue


def call_queue(
    db: Session,
    queue_id: int,
) -> Queue:
    queue = get_queue(db, queue_id)

    if queue.status not in {"waiting", "no_show"}:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only waiting queue entries can be called.",
        )

    queue.status = "called"
    queue.called_at = datetime.now(timezone.utc)
    queue.updated_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(queue)

    return queue


def start_service(
    db: Session,
    queue_id: int,
) -> Queue:
    queue = get_queue(db, queue_id)

    if queue.status != "called":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only called queue entries can start service.",
        )

    queue.status = "in_service"
    queue.service_start_time = datetime.now(timezone.utc)
    queue.updated_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(queue)

    return queue


def complete_service(
    db: Session,
    queue_id: int,
) -> Queue:
    queue = get_queue(db, queue_id)

    if queue.status != "in_service":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only queue entries in service can be completed.",
        )

    queue.status = "completed"
    queue.service_end_time = datetime.now(timezone.utc)
    queue.updated_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(queue)

    return queue


def cancel_queue(
    db: Session,
    queue_id: int,
) -> Queue:
    queue = get_queue(db, queue_id)

    if queue.status == "completed":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Completed queue entries cannot be cancelled.",
        )

    queue.status = "cancelled"
    queue.updated_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(queue)

    return queue


def mark_no_show(
    db: Session,
    queue_id: int,
) -> Queue:
    queue = get_queue(db, queue_id)

    if queue.status not in {"waiting", "called"}:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only waiting or called queue entries can be marked no-show.",
        )

    queue.status = "no_show"
    queue.updated_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(queue)

    return queue


def delete_queue(
    db: Session,
    queue_id: int,
) -> None:
    queue = get_queue(db, queue_id)

    db.delete(queue)
    db.commit()
