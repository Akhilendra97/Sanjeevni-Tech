from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.constants import UserRole
from app.core.database import get_db
from app.core.dependencies import get_current_user_payload, require_permission
from app.models.doctor import Doctor
from app.models.doctor_schedule import DoctorSchedule
from app.schemas.doctor_schedule import (
    DoctorScheduleCreate,
    DoctorScheduleResponse,
    DoctorScheduleUpdate,
)
from app.services.doctor_schedule_service import (
    create_schedule,
    delete_schedule,
    get_all_schedules,
    get_doctor_schedules,
    get_schedule_by_id,
    update_schedule,
)

router = APIRouter(prefix="/schedules", tags=["Doctor Schedules"])


def _current_doctor(db: Session, payload: dict) -> Doctor:
    try:
        user_id = int(payload.get("sub"))
    except (TypeError, ValueError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authenticated user.",
        )

    doctor = db.query(Doctor).filter(Doctor.user_id == user_id).first()
    if doctor is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Doctor profile is not linked to this account.",
        )
    return doctor


def _check_schedule_access(
    db: Session,
    payload: dict,
    schedule: DoctorSchedule,
) -> None:
    if payload.get("role") == UserRole.DOCTOR.value:
        doctor = _current_doctor(db, payload)
        if schedule.doctor_id != doctor.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can access only your own duty schedules.",
            )


@router.post(
    "",
    response_model=DoctorScheduleResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_permission("schedules.manage"))],
)
def create(
    request: DoctorScheduleCreate,
    db: Session = Depends(get_db),
    payload: dict = Depends(get_current_user_payload),
) -> DoctorSchedule:
    if payload.get("role") == UserRole.DOCTOR.value:
        doctor = _current_doctor(db, payload)
        if request.doctor_id != doctor.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can create schedules only for your own doctor profile.",
            )

    try:
        return create_schedule(
            db,
            doctor_id=request.doctor_id,
            day_of_week=request.day_of_week,
            start_time=request.start_time,
            end_time=request.end_time,
            slot_duration_minutes=request.slot_duration_minutes,
            is_available=request.is_available,
            notes=request.notes,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc


@router.get(
    "",
    response_model=list[DoctorScheduleResponse],
    dependencies=[Depends(require_permission("schedules.view"))],
)
def get_all(
    db: Session = Depends(get_db),
    payload: dict = Depends(get_current_user_payload),
) -> list[DoctorSchedule]:
    if payload.get("role") == UserRole.DOCTOR.value:
        doctor = _current_doctor(db, payload)
        return get_doctor_schedules(db, doctor.id)

    return get_all_schedules(db)


@router.get(
    "/doctor/{doctor_id}",
    response_model=list[DoctorScheduleResponse],
    dependencies=[Depends(require_permission("schedules.view"))],
)
def get_by_doctor(
    doctor_id: int,
    db: Session = Depends(get_db),
    payload: dict = Depends(get_current_user_payload),
) -> list[DoctorSchedule]:
    if payload.get("role") == UserRole.DOCTOR.value:
        doctor = _current_doctor(db, payload)
        if doctor_id != doctor.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can view only your own duty schedules.",
            )

    return get_doctor_schedules(db, doctor_id)


@router.get(
    "/{schedule_id}",
    response_model=DoctorScheduleResponse,
    dependencies=[Depends(require_permission("schedules.view"))],
)
def get_one(
    schedule_id: int,
    db: Session = Depends(get_db),
    payload: dict = Depends(get_current_user_payload),
) -> DoctorSchedule:
    schedule = get_schedule_by_id(db, schedule_id)
    if schedule is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Doctor schedule not found.",
        )

    _check_schedule_access(db, payload, schedule)
    return schedule


@router.patch(
    "/{schedule_id}",
    response_model=DoctorScheduleResponse,
    dependencies=[Depends(require_permission("schedules.manage"))],
)
def update(
    schedule_id: int,
    request: DoctorScheduleUpdate,
    db: Session = Depends(get_db),
    payload: dict = Depends(get_current_user_payload),
) -> DoctorSchedule:
    schedule = get_schedule_by_id(db, schedule_id)
    if schedule is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Doctor schedule not found.",
        )

    _check_schedule_access(db, payload, schedule)

    try:
        return update_schedule(
            db,
            schedule,
            day_of_week=request.day_of_week,
            start_time=request.start_time,
            end_time=request.end_time,
            slot_duration_minutes=request.slot_duration_minutes,
            is_available=request.is_available,
            notes=request.notes,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc


@router.delete(
    "/{schedule_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(require_permission("schedules.manage"))],
)
def delete(
    schedule_id: int,
    db: Session = Depends(get_db),
    payload: dict = Depends(get_current_user_payload),
) -> None:
    schedule = get_schedule_by_id(db, schedule_id)
    if schedule is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Doctor schedule not found.",
        )

    _check_schedule_access(db, payload, schedule)
    delete_schedule(db, schedule)
