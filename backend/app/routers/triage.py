from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.triage import (
    TriageCreate,
    TriageResponse,
    TriageUpdate,
)
from app.services.triage_service import (
    cancel_triage,
    complete_triage,
    create_triage,
    delete_triage,
    get_triage,
    get_triage_by_number,
    list_triages,
    reassess_triage,
    update_triage,
)


router = APIRouter(
    prefix="/triages",
    tags=["Triage Management"],
)


@router.post(
    "",
    response_model=TriageResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_triage_record(
    data: TriageCreate,
    db: Session = Depends(get_db),
):
    return create_triage(db, data)


@router.get(
    "",
    response_model=list[TriageResponse],
)
def get_triage_records(
    patient_id: int | None = Query(default=None),
    emergency_id: int | None = Query(default=None),
    triage_level: str | None = Query(default=None),
    triage_status: str | None = Query(default=None),
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=500),
    db: Session = Depends(get_db),
):
    return list_triages(
        db=db,
        patient_id=patient_id,
        emergency_id=emergency_id,
        triage_level=triage_level,
        triage_status=triage_status,
        skip=skip,
        limit=limit,
    )


@router.get(
    "/number/{triage_number}",
    response_model=TriageResponse,
)
def get_triage_record_by_number(
    triage_number: str,
    db: Session = Depends(get_db),
):
    return get_triage_by_number(db, triage_number)


@router.get(
    "/{triage_id}",
    response_model=TriageResponse,
)
def get_triage_record(
    triage_id: int,
    db: Session = Depends(get_db),
):
    return get_triage(db, triage_id)


@router.put(
    "/{triage_id}",
    response_model=TriageResponse,
)
def update_triage_record(
    triage_id: int,
    data: TriageUpdate,
    db: Session = Depends(get_db),
):
    return update_triage(db, triage_id, data)


@router.patch(
    "/{triage_id}/reassess",
    response_model=TriageResponse,
)
def reassess_triage_record(
    triage_id: int,
    data: TriageUpdate,
    db: Session = Depends(get_db),
):
    return reassess_triage(db, triage_id, data)


@router.patch(
    "/{triage_id}/complete",
    response_model=TriageResponse,
)
def complete_triage_record(
    triage_id: int,
    db: Session = Depends(get_db),
):
    return complete_triage(db, triage_id)


@router.patch(
    "/{triage_id}/cancel",
    response_model=TriageResponse,
)
def cancel_triage_record(
    triage_id: int,
    db: Session = Depends(get_db),
):
    return cancel_triage(db, triage_id)


@router.delete(
    "/{triage_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_triage_record(
    triage_id: int,
    db: Session = Depends(get_db),
):
    delete_triage(db, triage_id)
