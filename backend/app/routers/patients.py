from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.constants import UserRole
from app.core.database import get_db
from app.core.dependencies import require_role
from app.models.patient import Patient
from app.models.doctor import Doctor
from app.models.diagnosis import Diagnosis
from app.schemas.patient import (
    PatientCreate,
    PatientResponse,
    PatientUpdate,
)
from app.services.patient_service import (
    create_patient,
    deactivate_patient,
    get_patient_by_id,
    get_patient_by_number,
    get_patients,
    update_patient,
)


router = APIRouter(
    prefix="/patients",
    tags=["Patients"],
)


@router.post(
    "",
    response_model=PatientResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_patient_endpoint(
    request: PatientCreate,
    db: Session = Depends(get_db),
    _: dict = Depends(
        require_role(
            UserRole.ADMIN,
            UserRole.RECEPTIONIST,
        )
    ),
) -> Patient:

    try:
        return create_patient(
            db,
            data=request.model_dump(
                exclude_none=True,
            ),
        )

    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc


@router.get(
    "",
    response_model=list[PatientResponse],
)
def list_patients(
    search: str | None = Query(default=None, max_length=100),
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=500),
    is_active: bool | None = Query(default=True),
    db: Session = Depends(get_db),
    current_user: dict = Depends(
        require_role(
            UserRole.ADMIN,
            UserRole.DOCTOR,
            UserRole.NURSE,
            UserRole.RECEPTIONIST,
            UserRole.ACCOUNTANT,
        )
    ),
) -> list[Patient]:
    # Doctors see only patients assigned through Diagnosis.doctor_id.
    # Admin, nurse, and receptionist keep the existing all-patient behavior.
    if current_user.get("role") == UserRole.DOCTOR.value:
        try:
            user_id = int(current_user.get("sub"))
        except (TypeError, ValueError):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authenticated doctor account.",
            )

        doctor = db.query(Doctor).filter(Doctor.user_id == user_id).first()
        if doctor is None:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No doctor profile is linked to this account.",
            )

        query = (
            db.query(Patient)
            .join(Diagnosis, Diagnosis.patient_id == Patient.id)
            .filter(Diagnosis.doctor_id == doctor.id)
            .distinct()
        )

        if search and search.strip():
            term = f"%{search.strip()}%"
            query = query.filter(
                Patient.first_name.ilike(term)
                | Patient.last_name.ilike(term)
                | Patient.patient_number.ilike(term)
                | Patient.phone.ilike(term)
                | Patient.email.ilike(term)
            )

        return query.order_by(Patient.id.asc()).offset(skip).limit(limit).all()

    return get_patients(
        db,
        skip=skip,
        limit=limit,
        search=search,
        is_active=is_active,
    )


@router.get(
    "/number/{patient_number}",
    response_model=PatientResponse,
)
def get_patient_by_number_endpoint(
    patient_number: str,
    db: Session = Depends(get_db),
    _: dict = Depends(
        require_role(
            UserRole.ADMIN,
            UserRole.DOCTOR,
            UserRole.NURSE,
            UserRole.RECEPTIONIST,
            UserRole.ACCOUNTANT,
        )
    ),
) -> Patient:

    patient = get_patient_by_number(
        db,
        patient_number,
    )

    if patient is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient not found.",
        )

    return patient


@router.get(
    "/{patient_id}",
    response_model=PatientResponse,
)
def get_patient(
    patient_id: int,
    db: Session = Depends(get_db),
    _: dict = Depends(
        require_role(
            UserRole.ADMIN,
            UserRole.DOCTOR,
            UserRole.NURSE,
            UserRole.RECEPTIONIST,
            UserRole.ACCOUNTANT,
        )
    ),
) -> Patient:

    patient = get_patient_by_id(
        db,
        patient_id,
    )

    if patient is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient not found.",
        )

    return patient


@router.patch(
    "/{patient_id}",
    response_model=PatientResponse,
)
def update_patient_endpoint(
    patient_id: int,
    request: PatientUpdate,
    db: Session = Depends(get_db),
    _: dict = Depends(
        require_role(
            UserRole.ADMIN,
            UserRole.RECEPTIONIST,
        )
    ),
) -> Patient:

    patient = get_patient_by_id(
        db,
        patient_id,
    )

    if patient is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient not found.",
        )

    return update_patient(
        db,
        patient,
        request.model_dump(
            exclude_unset=True,
        ),
    )


@router.delete(
    "/{patient_id}",
    response_model=PatientResponse,
)
def deactivate_patient_endpoint(
    patient_id: int,
    db: Session = Depends(get_db),
    _: dict = Depends(require_role(UserRole.ADMIN, UserRole.RECEPTIONIST)),
) -> Patient:

    patient = get_patient_by_id(
        db,
        patient_id,
    )

    if patient is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient not found.",
        )

    return deactivate_patient(
        db,
        patient,
    )
