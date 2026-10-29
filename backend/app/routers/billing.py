from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.billing import Billing
from app.schemas.billing import (
    BillingCreate,
    BillingResponse,
    BillingUpdate,
)
from app.services.billing_service import (
    create_billing,
    delete_billing,
    get_billing_by_id,
    list_billings,
    update_billing,
)


router = APIRouter(
    prefix="/billing",
    tags=["Billing"],
)


@router.post(
    "",
    response_model=BillingResponse,
    status_code=status.HTTP_201_CREATED,
)
def create(
    request: BillingCreate,
    db: Session = Depends(get_db),
) -> Billing:

    try:
        return create_billing(
            db,
            patient_id=request.patient_id,
            bill_number=request.bill_number,
            bill_date=request.bill_date,
            bill_type=request.bill_type,
            description=request.description,
            subtotal=request.subtotal,
            discount=request.discount,
            tax=request.tax,
            total_amount=request.total_amount,
            paid_amount=request.paid_amount,
            payment_status=request.payment_status,
            payment_method=request.payment_method,
            notes=request.notes,
        )

    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc


@router.get(
    "",
    response_model=list[BillingResponse],
)
def get_all(
    db: Session = Depends(get_db),
) -> list[Billing]:

    return list_billings(db)


@router.get(
    "/{billing_id}",
    response_model=BillingResponse,
)
def get_one(
    billing_id: int,
    db: Session = Depends(get_db),
) -> Billing:

    billing = get_billing_by_id(
        db,
        billing_id,
    )

    if billing is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Billing record not found.",
        )

    return billing


@router.patch(
    "/{billing_id}",
    response_model=BillingResponse,
)
def update(
    billing_id: int,
    request: BillingUpdate,
    db: Session = Depends(get_db),
) -> Billing:

    billing = get_billing_by_id(
        db,
        billing_id,
    )

    if billing is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Billing record not found.",
        )

    return update_billing(
        db,
        billing,
        patient_id=request.patient_id,
        bill_date=request.bill_date,
        bill_type=request.bill_type,
        description=request.description,
        subtotal=request.subtotal,
        discount=request.discount,
        tax=request.tax,
        total_amount=request.total_amount,
        paid_amount=request.paid_amount,
        payment_status=request.payment_status,
        payment_method=request.payment_method,
        notes=request.notes,
    )


@router.delete(
    "/{billing_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete(
    billing_id: int,
    db: Session = Depends(get_db),
) -> None:

    billing = get_billing_by_id(
        db,
        billing_id,
    )

    if billing is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Billing record not found.",
        )

    delete_billing(
        db,
        billing,
    )