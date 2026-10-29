from datetime import date

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.diagnosis import Diagnosis
from app.schemas.diagnosis import (
    DiagnosisCreate,
    DiagnosisResponse,
    DiagnosisUpdate,
)
from app.services.diagnosis_service import (
    create_diagnosis,
    delete_diagnosis,
    get_diagnosis_by_id,
    list_diagnoses,
    list_patient_diagnoses,
    update_diagnosis,
)


router = APIRouter(
    prefix="/diagnoses",
    tags=["Diagnoses"],
)


@router.post(
    "",
    response_model=DiagnosisResponse,
    status_code=status.HTTP_201_CREATED,
)
def create(
    request: DiagnosisCreate,
    db: Session = Depends(get_db),
) -> Diagnosis:

    try:
        return create_diagnosis(
            db,
            patient_id=request.patient_id,
            doctor_id=request.doctor_id,
            diagnosis_code=request.diagnosis_code,
            diagnosis_name=request.diagnosis_name,
            diagnosis_type=request.diagnosis_type,
            description=request.description,
            symptoms=request.symptoms,
            severity=request.severity,
            diagnosis_date=request.diagnosis_date,
            notes=request.notes,
        )

    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc


@router.get(
    "",
    response_model=list[DiagnosisResponse],
)
def get_all(
    db: Session = Depends(get_db),
) -> list[Diagnosis]:

    return list_diagnoses(db)


@router.get(
    "/patient/{patient_id}",
    response_model=list[DiagnosisResponse],
)
def get_by_patient(
    patient_id: int,
    db: Session = Depends(get_db),
) -> list[Diagnosis]:

    return list_patient_diagnoses(
        db,
        patient_id,
    )


@router.get(
    "/{diagnosis_id}",
    response_model=DiagnosisResponse,
)
def get_one(
    diagnosis_id: int,
    db: Session = Depends(get_db),
) -> Diagnosis:

    diagnosis = get_diagnosis_by_id(
        db,
        diagnosis_id,
    )

    if diagnosis is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Diagnosis not found.",
        )

    return diagnosis


@router.patch(
    "/{diagnosis_id}",
    response_model=DiagnosisResponse,
)
def update(
    diagnosis_id: int,
    request: DiagnosisUpdate,
    db: Session = Depends(get_db),
) -> Diagnosis:

    diagnosis = get_diagnosis_by_id(
        db,
        diagnosis_id,
    )

    if diagnosis is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Diagnosis not found.",
        )

    return update_diagnosis(
        db,
        diagnosis,
        diagnosis_name=request.diagnosis_name,
        diagnosis_type=request.diagnosis_type,
        description=request.description,
        symptoms=request.symptoms,
        severity=request.severity,
        diagnosis_date=request.diagnosis_date,
        notes=request.notes,
    )


@router.delete(
    "/{diagnosis_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete(
    diagnosis_id: int,
    db: Session = Depends(get_db),
) -> None:

    diagnosis = get_diagnosis_by_id(
        db,
        diagnosis_id,
    )

    if diagnosis is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Diagnosis not found.",
        )

    delete_diagnosis(
        db,
        diagnosis,
    )
