from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.queue import (
    QueueCreate,
    QueueResponse,
    QueueUpdate,
)
from app.services.queue_service import (
    call_queue,
    cancel_queue,
    complete_service,
    create_queue,
    delete_queue,
    get_queue,
    get_queue_by_number,
    list_queues,
    mark_no_show,
    start_service,
    update_queue,
)


router = APIRouter(
    prefix="/queues",
    tags=["Queue Management"],
)


@router.post(
    "",
    response_model=QueueResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_queue_record(
    data: QueueCreate,
    db: Session = Depends(get_db),
):
    return create_queue(db, data)


@router.get(
    "",
    response_model=list[QueueResponse],
)
def get_queue_records(
    patient_id: int | None = Query(default=None),
    doctor_id: int | None = Query(default=None),
    department_id: int | None = Query(default=None),
    queue_type: str | None = Query(default=None),
    queue_status: str | None = Query(default=None),
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=500),
    db: Session = Depends(get_db),
):
    return list_queues(
        db=db,
        patient_id=patient_id,
        doctor_id=doctor_id,
        department_id=department_id,
        queue_type=queue_type,
        queue_status=queue_status,
        skip=skip,
        limit=limit,
    )


@router.get(
    "/number/{queue_number}",
    response_model=QueueResponse,
)
def get_queue_record_by_number(
    queue_number: str,
    db: Session = Depends(get_db),
):
    return get_queue_by_number(db, queue_number)


@router.get(
    "/{queue_id}",
    response_model=QueueResponse,
)
def get_queue_record(
    queue_id: int,
    db: Session = Depends(get_db),
):
    return get_queue(db, queue_id)


@router.put(
    "/{queue_id}",
    response_model=QueueResponse,
)
def update_queue_record(
    queue_id: int,
    data: QueueUpdate,
    db: Session = Depends(get_db),
):
    return update_queue(db, queue_id, data)


@router.patch(
    "/{queue_id}/call",
    response_model=QueueResponse,
)
def call_queue_record(
    queue_id: int,
    db: Session = Depends(get_db),
):
    return call_queue(db, queue_id)


@router.patch(
    "/{queue_id}/start-service",
    response_model=QueueResponse,
)
def start_queue_service(
    queue_id: int,
    db: Session = Depends(get_db),
):
    return start_service(db, queue_id)


@router.patch(
    "/{queue_id}/complete",
    response_model=QueueResponse,
)
def complete_queue_service(
    queue_id: int,
    db: Session = Depends(get_db),
):
    return complete_service(db, queue_id)


@router.patch(
    "/{queue_id}/cancel",
    response_model=QueueResponse,
)
def cancel_queue_record(
    queue_id: int,
    db: Session = Depends(get_db),
):
    return cancel_queue(db, queue_id)


@router.patch(
    "/{queue_id}/no-show",
    response_model=QueueResponse,
)
def mark_queue_no_show(
    queue_id: int,
    db: Session = Depends(get_db),
):
    return mark_no_show(db, queue_id)


@router.delete(
    "/{queue_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_queue_record(
    queue_id: int,
    db: Session = Depends(get_db),
):
    delete_queue(db, queue_id)
