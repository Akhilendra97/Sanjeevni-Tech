from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.discharge import Discharge
from app.schemas.discharge import (
    DischargeCreate,
    DischargeResponse,
    DischargeUpdate,
)
from app.services.discharge_service import (
    create_discharge,
    delete_discharge,
    get_discharge_by_id,
    list_discharges,
    update_discharge,
)


router = APIRouter(
    prefix="/discharges",
    tags=["Discharges"],
)


@router.post(
    "",
    response_model=DischargeResponse,
    status_code=status.HTTP_201_CREATED,
)
def create(
    request: DischargeCreate,
    db: Session = Depends(get_db),
) -> Discharge:

    return create_discharge(
        db,
        admission_id=request.admission_id,
        patient_id=request.patient_id,
        doctor_id=request.doctor_id,
        discharge_number=request.discharge_number,
        discharge_date=request.discharge_date,
        discharge_type=request.discharge_type,
        final_diagnosis=request.final_diagnosis,
        treatment_summary=request.treatment_summary,
        medications=request.medications,
        follow_up_instructions=request.follow_up_instructions,
        condition_at_discharge=request.condition_at_discharge,
        notes=request.notes,
    )


@router.get(
    "",
    response_model=list[DischargeResponse],
)
def get_all(
    db: Session = Depends(get_db),
) -> list[Discharge]:

    return list_discharges(db)


@router.get(
    "/{discharge_id}",
    response_model=DischargeResponse,
)
def get_one(
    discharge_id: int,
    db: Session = Depends(get_db),
) -> Discharge:

    discharge = get_discharge_by_id(
        db,
        discharge_id,
    )

    if discharge is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Discharge not found.",
        )

    return discharge


@router.patch(
    "/{discharge_id}",
    response_model=DischargeResponse,
)
def update(
    discharge_id: int,
    request: DischargeUpdate,
    db: Session = Depends(get_db),
) -> Discharge:

    discharge = get_discharge_by_id(
        db,
        discharge_id,
    )

    if discharge is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Discharge not found.",
        )

    return update_discharge(
        db,
        discharge,
        discharge_date=request.discharge_date,
        discharge_type=request.discharge_type,
        final_diagnosis=request.final_diagnosis,
        treatment_summary=request.treatment_summary,
        medications=request.medications,
        follow_up_instructions=request.follow_up_instructions,
        condition_at_discharge=request.condition_at_discharge,
        notes=request.notes,
    )


@router.delete(
    "/{discharge_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete(
    discharge_id: int,
    db: Session = Depends(get_db),
) -> None:

    discharge = get_discharge_by_id(
        db,
        discharge_id,
    )

    if discharge is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Discharge not found.",
        )

    delete_discharge(
        db,
        discharge,
    )