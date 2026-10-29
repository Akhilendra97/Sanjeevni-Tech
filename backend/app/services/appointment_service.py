from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.constants import AppointmentStatus, Priority
from app.models.appointment import Appointment
from app.models.doctor import Doctor
from app.models.patient import Patient


def get_appointment_by_id(
    db: Session,
    appointment_id: int,
) -> Appointment | None:
    return db.scalar(
        select(Appointment)
        .where(
            Appointment.id == appointment_id
        )
    )


def get_appointment_by_number(
    db: Session,
    appointment_number: str,
) -> Appointment | None:
    return db.scalar(
        select(Appointment)
        .where(
            Appointment.appointment_number == appointment_number
        )
    )


def create_appointment(
    db: Session,
    *,
    appointment_number: str,
    patient_id: int,
    doctor_id: int,
    appointment_date,
    appointment_time,
    status: AppointmentStatus,
    priority: Priority,
    reason: str | None,
    notes: str | None,
) -> Appointment:

    if get_appointment_by_number(
        db,
        appointment_number,
    ):
        raise ValueError(
            "Appointment number is already registered."
        )

    patient = db.scalar(
        select(Patient).where(
            Patient.id == patient_id,
            Patient.is_active.is_(True),
        )
    )

    if patient is None:
        raise ValueError(
            "Patient not found or inactive."
        )

    doctor = db.scalar(
        select(Doctor).where(
            Doctor.id == doctor_id,
            Doctor.is_available.is_(True),
        )
    )

    if doctor is None:
        raise ValueError(
            "Doctor not found or unavailable."
        )

    existing_slot = db.scalar(
        select(Appointment).where(
            Appointment.doctor_id == doctor_id,
            Appointment.appointment_date == appointment_date,
            Appointment.appointment_time == appointment_time,
            Appointment.status.not_in(
                [
                    AppointmentStatus.CANCELLED.value,
                    AppointmentStatus.NO_SHOW.value,
                ]
            ),
        )
    )

    if existing_slot is not None:
        raise ValueError(
            "Doctor already has an appointment at this time."
        )

    appointment = Appointment(
        appointment_number=appointment_number.strip(),
        patient_id=patient_id,
        doctor_id=doctor_id,
        appointment_date=appointment_date,
        appointment_time=appointment_time,
        status=status.value,
        priority=priority.value,
        reason=reason.strip() if reason else None,
        notes=notes.strip() if notes else None,
    )

    db.add(appointment)
    db.commit()
    db.refresh(appointment)

    return appointment


def list_appointments(
    db: Session,
    patient_id: int | None = None,
) -> list[Appointment]:

    statement = select(Appointment)

    if patient_id is not None:
        statement = statement.where(
            Appointment.patient_id == patient_id
        )

    statement = statement.order_by(
        Appointment.appointment_date,
        Appointment.appointment_time,
    )

    return list(
        db.scalars(statement).all()
    )


def update_appointment(
    db: Session,
    appointment: Appointment,
    *,
    appointment_date=None,
    appointment_time=None,
    status=None,
    priority=None,
    reason=None,
    notes=None,
    cancellation_reason=None,
) -> Appointment:

    if appointment_date is not None:
        appointment.appointment_date = appointment_date

    if appointment_time is not None:
        appointment.appointment_time = appointment_time

    if status is not None:
        appointment.status = status.value

    if priority is not None:
        appointment.priority = priority.value

    if reason is not None:
        appointment.reason = reason.strip()

    if notes is not None:
        appointment.notes = notes.strip()

    if cancellation_reason is not None:
        appointment.cancellation_reason = (
            cancellation_reason.strip()
        )

    db.commit()
    db.refresh(appointment)

    return appointment


def delete_appointment(
    db: Session,
    appointment: Appointment,
) -> None:
    db.delete(appointment)
    db.commit()
