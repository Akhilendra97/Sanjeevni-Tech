from app.core.dependencies import require_permission
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.admission import Admission
from app.schemas.admission import (
    AdmissionCreate,
    AdmissionResponse,
    AdmissionUpdate,
)
from app.services.admission_service import (
    create_admission,
    delete_admission,
    get_admission_by_id,
    list_admissions,
    update_admission,
)


router = APIRouter(
    prefix="/admissions",
    tags=["Admissions"],
)


@router.post(
    "",
    response_model=AdmissionResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_permission("admissions.manage"))],
)
def create(
    request: AdmissionCreate,
    db: Session = Depends(get_db),
) -> Admission:

    try:
        return create_admission(
            db,
            admission_number=request.admission_number,
            patient_id=request.patient_id,
            doctor_id=request.doctor_id,
            ward_id=request.ward_id,
            bed_id=request.bed_id,
            admission_date=request.admission_date,
            status=request.status,
            reason=request.reason,
            diagnosis=request.diagnosis,
            notes=request.notes,
            discharge_summary=request.discharge_summary,
        )

    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc


@router.get(
    "",
    response_model=list[AdmissionResponse],
    dependencies=[Depends(require_permission("admissions.view"))],
)
def get_all(
    db: Session = Depends(get_db),
) -> list[Admission]:

    return list_admissions(db)


@router.get(
    "/{admission_id}",
    response_model=AdmissionResponse,
    dependencies=[Depends(require_permission("admissions.view"))],
)
def get_one(
    admission_id: int,
    db: Session = Depends(get_db),
) -> Admission:

    admission = get_admission_by_id(
        db,
        admission_id,
    )

    if admission is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Admission not found.",
        )

    return admission


@router.patch(
    "/{admission_id}",
    response_model=AdmissionResponse,
    dependencies=[Depends(require_permission("admissions.manage"))],
)
def update(
    admission_id: int,
    request: AdmissionUpdate,
    db: Session = Depends(get_db),
) -> Admission:

    admission = get_admission_by_id(
        db,
        admission_id,
    )

    if admission is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Admission not found.",
        )

    try:
        return update_admission(
            db,
            admission,
            ward_id=request.ward_id,
            bed_id=request.bed_id,
            discharge_date=request.discharge_date,
            status=request.status,
            reason=request.reason,
            diagnosis=request.diagnosis,
            notes=request.notes,
            discharge_summary=request.discharge_summary,
        )

    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc


@router.delete(
    "/{admission_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(require_permission("admissions.manage"))],
)
def delete(
    admission_id: int,
    db: Session = Depends(get_db),
) -> None:

    admission = get_admission_by_id(
        db,
        admission_id,
    )

    if admission is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Admission not found.",
        )

    delete_admission(
        db,
        admission,
    )