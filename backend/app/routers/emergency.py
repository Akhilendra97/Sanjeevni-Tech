from app.core.dependencies import require_permission
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.emergency import (
    EmergencyCreate,
    EmergencyResponse,
    EmergencyUpdate,
)
from app.services.emergency_service import (
    create_emergency,
    delete_emergency,
    get_emergency,
    get_emergency_by_number,
    list_emergencies,
    update_emergency,
)

router = APIRouter(
    prefix="/emergencies",
    tags=["Emergency Management"],
)


@router.post(
    "",
    response_model=EmergencyResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_permission("emergency.manage"))],
)
def create_emergency_record(
    emergency_data: EmergencyCreate,
    db: Session = Depends(get_db),
):
    return create_emergency(
        db=db,
        emergency_data=emergency_data,
    )


@router.get(
    "",
    response_model=list[EmergencyResponse],
    dependencies=[Depends(require_permission("emergency.view"))],
)
def get_emergency_records(
    patient_id: int | None = Query(
        default=None,
        gt=0,
    ),
    doctor_id: int | None = Query(
        default=None,
        gt=0,
    ),
    status_value: str | None = None,
    triage_level: str | None = None,
    db: Session = Depends(get_db),
):
    return list_emergencies(
        db=db,
        patient_id=patient_id,
        doctor_id=doctor_id,
        status_value=status_value,
        triage_level=triage_level,
    )


@router.get(
    "/number/{emergency_number}",
    response_model=EmergencyResponse,
    dependencies=[Depends(require_permission("emergency.view"))],
)
def get_emergency_by_number_record(
    emergency_number: str,
    db: Session = Depends(get_db),
):
    return get_emergency_by_number(
        db=db,
        emergency_number=emergency_number,
    )


@router.get(
    "/{emergency_id}",
    response_model=EmergencyResponse,
    dependencies=[Depends(require_permission("emergency.view"))],
)
def get_emergency_record(
    emergency_id: int,
    db: Session = Depends(get_db),
):
    return get_emergency(
        db=db,
        emergency_id=emergency_id,
    )


@router.put(
    "/{emergency_id}",
    response_model=EmergencyResponse,
    dependencies=[Depends(require_permission("emergency.manage"))],
)
def update_emergency_record(
    emergency_id: int,
    emergency_data: EmergencyUpdate,
    db: Session = Depends(get_db),
):
    return update_emergency(
        db=db,
        emergency_id=emergency_id,
        emergency_data=emergency_data,
    )


@router.delete(
    "/{emergency_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(require_permission("emergency.manage"))],
)
def delete_emergency_record(
    emergency_id: int,
    db: Session = Depends(get_db),
):
    delete_emergency(
        db=db,
        emergency_id=emergency_id,
    )
    return None
