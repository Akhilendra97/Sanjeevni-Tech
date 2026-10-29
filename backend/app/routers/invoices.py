from datetime import date

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.invoice import (
    InvoiceCreate,
    InvoiceResponse,
    InvoiceUpdate,
)
from app.services.invoice_service import InvoiceService


router = APIRouter(
    prefix="/invoices",
    tags=["Invoices"],
)


@router.post(
    "",
    response_model=InvoiceResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_invoice(
    data: InvoiceCreate,
    db: Session = Depends(get_db),
):
    return InvoiceService.create(db, data)


@router.get(
    "",
    response_model=list[InvoiceResponse],
)
def list_invoices(
    patient_id: int | None = Query(default=None),
    admission_id: int | None = Query(default=None),
    invoice_status: str | None = Query(default=None),
    db: Session = Depends(get_db),
):
    return InvoiceService.list(
        db,
        patient_id=patient_id,
        admission_id=admission_id,
        invoice_status=invoice_status,
    )


@router.get(
    "/number/{invoice_number}",
    response_model=InvoiceResponse,
)
def get_invoice_by_number(
    invoice_number: str,
    db: Session = Depends(get_db),
):
    return InvoiceService.get_by_number(
        db,
        invoice_number,
    )


@router.get(
    "/{invoice_id}",
    response_model=InvoiceResponse,
)
def get_invoice(
    invoice_id: int,
    db: Session = Depends(get_db),
):
    return InvoiceService.get(
        db,
        invoice_id,
    )


@router.put(
    "/{invoice_id}",
    response_model=InvoiceResponse,
)
def update_invoice(
    invoice_id: int,
    data: InvoiceUpdate,
    db: Session = Depends(get_db),
):
    return InvoiceService.update(
        db,
        invoice_id,
        data,
    )


@router.delete(
    "/{invoice_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_invoice(
    invoice_id: int,
    db: Session = Depends(get_db),
):
    InvoiceService.delete(
        db,
        invoice_id,
    )
    return None
