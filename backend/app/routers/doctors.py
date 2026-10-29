from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.constants import UserRole
from app.core.database import get_db
from app.core.dependencies import require_role
from app.models.doctor import Doctor
from app.schemas.doctor import (
    DoctorCreate,
    DoctorResponse,
    DoctorUpdate,
)
from app.services.doctor_service import (
    create_doctor,
    delete_doctor,
    get_all_doctors,
    get_doctor,
    update_doctor,
)


router = APIRouter(
    prefix="/doctors",
    tags=["Doctors"],
)


@router.post(
    "",
    response_model=DoctorResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_doctor_api(
    data: DoctorCreate,
    db: Session = Depends(get_db),
    _: dict = Depends(require_role(UserRole.ADMIN)),
) -> DoctorResponse:

    try:
        return create_doctor(
            db,
            data,
        )

    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc


@router.get(
    "",
    response_model=list[DoctorResponse],
)
def list_doctors(
    db: Session = Depends(get_db),
    _: dict = Depends(
        require_role(
            UserRole.ADMIN,
            UserRole.DOCTOR,
            UserRole.RECEPTIONIST,
        )
    ),
) -> list[DoctorResponse]:

    from app.models.user import User

    return (
        db.query(Doctor)
        .join(User, Doctor.user_id == User.id)
        .filter(User.status != "inactive")
        .order_by(Doctor.id)
        .all()
    )


@router.get(
    "/me",
    response_model=DoctorResponse,
)
def get_my_doctor_profile(
    payload: dict = Depends(require_role(UserRole.DOCTOR)),
    db: Session = Depends(get_db),
) -> DoctorResponse:
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
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No doctor profile is linked to this account.",
        )

    return doctor

@router.get(
    "/{doctor_id}",
    response_model=DoctorResponse,
)
def get_doctor_api(
    doctor_id: int,
    db: Session = Depends(get_db),
    _: dict = Depends(
        require_role(
            UserRole.ADMIN,
            UserRole.DOCTOR,
        )
    ),
) -> DoctorResponse:

    doctor = get_doctor(
        db,
        doctor_id,
    )

    if doctor is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Doctor not found.",
        )

    return doctor


@router.patch(
    "/{doctor_id}",
    response_model=DoctorResponse,
)
def update_doctor_api(
    doctor_id: int,
    data: DoctorUpdate,
    db: Session = Depends(get_db),
    _: dict = Depends(require_role(UserRole.ADMIN)),
) -> DoctorResponse:

    doctor = get_doctor(
        db,
        doctor_id,
    )

    if doctor is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Doctor not found.",
        )

    try:
        return update_doctor(
            db,
            doctor,
            data,
        )

    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc


@router.delete(
    "/{doctor_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_doctor_api(
    doctor_id: int,
    db: Session = Depends(get_db),
    _: dict = Depends(require_role(UserRole.ADMIN)),
) -> None:

    doctor = get_doctor(
        db,
        doctor_id,
    )

    if doctor is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Doctor not found.",
        )

    delete_doctor(
        db,
        doctor,
    )

