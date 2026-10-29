from app.core.dependencies import get_current_user_payload, require_permission
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.constants import UserRole
from app.core.database import get_db
from app.models.appointment import Appointment
from app.models.patient import Patient
from app.models.doctor import Doctor
from app.schemas.appointment import (
    AppointmentCreate,
    AppointmentResponse,
    AppointmentUpdate,
)
from app.services.appointment_service import (
    create_appointment,
    delete_appointment,
    get_appointment_by_id,
    list_appointments,
    update_appointment,
)


router = APIRouter(
    prefix="/appointments",
    tags=["Appointments"],
)


def _get_current_patient(
    db: Session,
    payload: dict,
) -> Patient:
    role = payload.get("role")

    if role != UserRole.PATIENT.value:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Patient access is required.",
        )

    user_id = payload.get("sub")

    try:
        user_id = int(user_id)
    except (TypeError, ValueError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authenticated user.",
        )

    patient = (
        db.query(Patient)
        .filter(
            Patient.user_id == user_id,
            Patient.is_active.is_(True),
        )
        .first()
    )

    if patient is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Patient profile is not linked to this account.",
        )

    return patient


def _ensure_appointment_access(
    appointment: Appointment,
    payload: dict,
) -> None:
    if payload.get("role") != UserRole.PATIENT.value:
        return

    user_id = payload.get("sub")

    try:
        user_id = int(user_id)
    except (TypeError, ValueError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authenticated user.",
        )

    if appointment.patient is None or appointment.patient.user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can access only your own appointments.",
        )


@router.post(
    "",
    response_model=AppointmentResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_permission("appointments.manage"))],
)
def create(
    request: AppointmentCreate,
    db: Session = Depends(get_db),
    payload: dict = Depends(get_current_user_payload),
) -> Appointment:

    if payload.get("role") == UserRole.PATIENT.value:
        patient = _get_current_patient(
            db,
            payload,
        )

        if request.patient_id != patient.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Patients can create appointments only for themselves.",
            )

    try:
        return create_appointment(
            db,
            appointment_number=request.appointment_number,
            patient_id=request.patient_id,
            doctor_id=request.doctor_id,
            appointment_date=request.appointment_date,
            appointment_time=request.appointment_time,
            status=request.status,
            priority=request.priority,
            reason=request.reason,
            notes=request.notes,
        )

    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc


@router.get(
    "",
    response_model=list[AppointmentResponse],
    dependencies=[Depends(require_permission("appointments.view"))],
)
def get_all(
    db: Session = Depends(get_db),
    payload: dict = Depends(get_current_user_payload),
) -> list[Appointment]:

    if payload.get("role") == UserRole.PATIENT.value:
        patient = _get_current_patient(
            db,
            payload,
        )

        return list_appointments(
            db,
            patient_id=patient.id,
        )

    if payload.get("role") == UserRole.DOCTOR.value:
        try:
            user_id = int(payload.get("sub"))
        except (TypeError, ValueError):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid authenticated doctor account.")
        doctor = db.query(Doctor).filter(Doctor.user_id == user_id).first()
        if doctor is None:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No doctor profile is linked to this account.")
        return db.query(Appointment).filter(Appointment.doctor_id == doctor.id).order_by(
            Appointment.appointment_date.asc(), Appointment.appointment_time.asc()
        ).all()

    if payload.get("role") == UserRole.DOCTOR.value:
        try:
            user_id = int(payload.get("sub"))
        except (TypeError, ValueError):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid authenticated doctor account.")
        doctor = db.query(Doctor).filter(Doctor.user_id == user_id).first()
        if doctor is None:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No doctor profile is linked to this account.")
        return db.query(Appointment).filter(Appointment.doctor_id == doctor.id).order_by(
            Appointment.appointment_date.asc(), Appointment.appointment_time.asc()
        ).all()

    return list_appointments(db)


@router.get(
    "/{appointment_id}",
    response_model=AppointmentResponse,
    dependencies=[Depends(require_permission("appointments.view"))],
)
def get_one(
    appointment_id: int,
    db: Session = Depends(get_db),
    payload: dict = Depends(get_current_user_payload),
) -> Appointment:

    appointment = get_appointment_by_id(
        db,
        appointment_id,
    )

    if appointment is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Appointment not found.",
        )

    _ensure_appointment_access(
        appointment,
        payload,
    )

    if payload.get("role") == UserRole.DOCTOR.value:
        try:
            user_id = int(payload.get("sub"))
        except (TypeError, ValueError):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid authenticated doctor account.")
        doctor = db.query(Doctor).filter(Doctor.user_id == user_id).first()
        if doctor is None or appointment.doctor_id != doctor.id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Appointment not found.")

    return appointment


@router.patch(
    "/{appointment_id}",
    response_model=AppointmentResponse,
    dependencies=[Depends(require_permission("appointments.manage"))],
)
def update(
    appointment_id: int,
    request: AppointmentUpdate,
    db: Session = Depends(get_db),
    payload: dict = Depends(get_current_user_payload),
) -> Appointment:

    appointment = get_appointment_by_id(
        db,
        appointment_id,
    )

    if appointment is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Appointment not found.",
        )

    _ensure_appointment_access(
        appointment,
        payload,
    )

    return update_appointment(
        db,
        appointment,
        appointment_date=request.appointment_date,
        appointment_time=request.appointment_time,
        status=request.status,
        priority=request.priority,
        reason=request.reason,
        notes=request.notes,
        cancellation_reason=request.cancellation_reason,
    )


@router.delete(
    "/{appointment_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(require_permission("appointments.manage"))],
)
def delete(
    appointment_id: int,
    db: Session = Depends(get_db),
    payload: dict = Depends(get_current_user_payload),
) -> None:

    appointment = get_appointment_by_id(
        db,
        appointment_id,
    )

    if appointment is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Appointment not found.",
        )

    _ensure_appointment_access(
        appointment,
        payload,
    )

    delete_appointment(
        db,
        appointment,
    )
