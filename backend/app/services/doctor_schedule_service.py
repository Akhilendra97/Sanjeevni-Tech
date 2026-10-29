from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.doctor import Doctor
from app.models.doctor_schedule import DoctorSchedule


def get_schedule_by_id(
    db: Session,
    schedule_id: int,
) -> DoctorSchedule | None:
    return db.scalar(
        select(DoctorSchedule).where(
            DoctorSchedule.id == schedule_id
        )
    )


def get_doctor_schedules(
    db: Session,
    doctor_id: int,
) -> list[DoctorSchedule]:
    statement = (
        select(DoctorSchedule)
        .where(
            DoctorSchedule.doctor_id == doctor_id
        )
        .order_by(
            DoctorSchedule.day_of_week,
            DoctorSchedule.start_time,
        )
    )

    return list(db.scalars(statement).all())


def get_all_schedules(
    db: Session,
) -> list[DoctorSchedule]:
    statement = select(DoctorSchedule).order_by(
        DoctorSchedule.doctor_id,
        DoctorSchedule.day_of_week,
        DoctorSchedule.start_time,
    )

    return list(db.scalars(statement).all())


def create_schedule(
    db: Session,
    *,
    doctor_id: int,
    day_of_week: str,
    start_time,
    end_time,
    slot_duration_minutes: int,
    is_available: bool,
    notes: str | None,
) -> DoctorSchedule:

    doctor = db.scalar(
        select(Doctor).where(
            Doctor.id == doctor_id,
        )
    )

    if doctor is None:
        raise ValueError("Doctor not found.")

    if start_time >= end_time:
        raise ValueError(
            "Start time must be before end time."
        )

    existing = db.scalar(
        select(DoctorSchedule).where(
            DoctorSchedule.doctor_id == doctor_id,
            DoctorSchedule.day_of_week
            == day_of_week.strip().lower(),
            DoctorSchedule.start_time == start_time,
            DoctorSchedule.end_time == end_time,
        )
    )

    if existing is not None:
        raise ValueError(
            "This schedule already exists for the doctor."
        )

    schedule = DoctorSchedule(
        doctor_id=doctor_id,
        day_of_week=day_of_week.strip().lower(),
        start_time=start_time,
        end_time=end_time,
        slot_duration_minutes=slot_duration_minutes,
        is_available=is_available,
        notes=notes.strip() if notes else None,
    )

    db.add(schedule)
    db.commit()
    db.refresh(schedule)

    return schedule


def update_schedule(
    db: Session,
    schedule: DoctorSchedule,
    *,
    day_of_week=None,
    start_time=None,
    end_time=None,
    slot_duration_minutes=None,
    is_available=None,
    notes=None,
) -> DoctorSchedule:

    new_start = (
        start_time
        if start_time is not None
        else schedule.start_time
    )

    new_end = (
        end_time
        if end_time is not None
        else schedule.end_time
    )

    if new_start >= new_end:
        raise ValueError(
            "Start time must be before end time."
        )

    if day_of_week is not None:
        schedule.day_of_week = (
            day_of_week.strip().lower()
        )

    if start_time is not None:
        schedule.start_time = start_time

    if end_time is not None:
        schedule.end_time = end_time

    if slot_duration_minutes is not None:
        schedule.slot_duration_minutes = (
            slot_duration_minutes
        )

    if is_available is not None:
        schedule.is_available = is_available

    if notes is not None:
        schedule.notes = notes.strip()

    db.commit()
    db.refresh(schedule)

    return schedule


def delete_schedule(
    db: Session,
    schedule: DoctorSchedule,
) -> None:
    db.delete(schedule)
    db.commit()