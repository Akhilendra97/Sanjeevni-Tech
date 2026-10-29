from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.payment import (
    PaymentCreate,
    PaymentResponse,
    PaymentUpdate,
)
from app.services.payment_service import PaymentService


router = APIRouter(
    prefix="/payments",
    tags=["Payments"],
)


@router.post(
    "",
    response_model=PaymentResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_payment(
    data: PaymentCreate,
    db: Session = Depends(get_db),
):
    return PaymentService.create(
        db,
        data,
    )


@router.get(
    "",
    response_model=list[PaymentResponse],
)
def list_payments(
    invoice_id: int | None = Query(default=None),
    patient_id: int | None = Query(default=None),
    payment_status: str | None = Query(default=None),
    db: Session = Depends(get_db),
):
    return PaymentService.list(
        db,
        invoice_id=invoice_id,
        patient_id=patient_id,
        payment_status=payment_status,
    )


@router.get(
    "/number/{payment_number}",
    response_model=PaymentResponse,
)
def get_payment_by_number(
    payment_number: str,
    db: Session = Depends(get_db),
):
    return PaymentService.get_by_number(
        db,
        payment_number,
    )


@router.get(
    "/{payment_id}",
    response_model=PaymentResponse,
)
def get_payment(
    payment_id: int,
    db: Session = Depends(get_db),
):
    return PaymentService.get(
        db,
        payment_id,
    )


@router.put(
    "/{payment_id}",
    response_model=PaymentResponse,
)
def update_payment(
    payment_id: int,
    data: PaymentUpdate,
    db: Session = Depends(get_db),
):
    return PaymentService.update(
        db,
        payment_id,
        data,
    )


@router.delete(
    "/{payment_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_payment(
    payment_id: int,
    db: Session = Depends(get_db),
):
    PaymentService.delete(
        db,
        payment_id,
    )
    return None
