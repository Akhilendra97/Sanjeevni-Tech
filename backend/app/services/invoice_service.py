from decimal import Decimal

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.admission import Admission
from app.models.invoice import Invoice
from app.models.patient import Patient
from app.schemas.invoice import InvoiceCreate, InvoiceUpdate


class InvoiceService:

    @staticmethod
    def _validate_amounts(
        subtotal: Decimal,
        tax_amount: Decimal,
        discount_amount: Decimal,
        total_amount: Decimal,
        paid_amount: Decimal,
    ) -> None:
        if discount_amount > subtotal + tax_amount:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Discount amount cannot exceed subtotal plus tax.",
            )

        calculated_total = subtotal + tax_amount - discount_amount

        if total_amount != calculated_total:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    "Total amount must equal "
                    "subtotal + tax amount - discount amount."
                ),
            )

        if paid_amount > total_amount:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Paid amount cannot exceed total amount.",
            )

    @staticmethod
    def _calculate_status(
        total_amount: Decimal,
        paid_amount: Decimal,
    ) -> str:
        if paid_amount <= Decimal("0.00"):
            return "unpaid"

        if paid_amount < total_amount:
            return "partially_paid"

        return "paid"

    @staticmethod
    def _validate_references(
        db: Session,
        patient_id: int,
        admission_id: int | None,
    ) -> None:
        patient = db.get(Patient, patient_id)

        if not patient:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Patient not found.",
            )

        if admission_id is not None:
            admission = db.get(Admission, admission_id)

            if not admission:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Admission not found.",
                )

            if admission.patient_id != patient_id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Admission does not belong to the selected patient.",
                )

    @staticmethod
    def create(
        db: Session,
        data: InvoiceCreate,
    ) -> Invoice:

        existing = db.scalar(
            select(Invoice).where(
                Invoice.invoice_number == data.invoice_number
            )
        )

        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Invoice number already exists.",
            )

        InvoiceService._validate_references(
            db,
            data.patient_id,
            data.admission_id,
        )

        InvoiceService._validate_amounts(
            data.subtotal,
            data.tax_amount,
            data.discount_amount,
            data.total_amount,
            data.paid_amount,
        )

        calculated_balance = data.total_amount - data.paid_amount

        invoice = Invoice(
            invoice_number=data.invoice_number,
            patient_id=data.patient_id,
            admission_id=data.admission_id,
            invoice_date=data.invoice_date,
            due_date=data.due_date,
            subtotal=data.subtotal,
            tax_amount=data.tax_amount,
            discount_amount=data.discount_amount,
            total_amount=data.total_amount,
            paid_amount=data.paid_amount,
            balance_amount=calculated_balance,
            status=InvoiceService._calculate_status(
                data.total_amount,
                data.paid_amount,
            ),
            notes=data.notes,
        )

        db.add(invoice)
        db.commit()
        db.refresh(invoice)

        return invoice

    @staticmethod
    def get(
        db: Session,
        invoice_id: int,
    ) -> Invoice:

        invoice = db.get(Invoice, invoice_id)

        if not invoice:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Invoice not found.",
            )

        return invoice

    @staticmethod
    def get_by_number(
        db: Session,
        invoice_number: str,
    ) -> Invoice:

        invoice = db.scalar(
            select(Invoice).where(
                Invoice.invoice_number == invoice_number
            )
        )

        if not invoice:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Invoice not found.",
            )

        return invoice

    @staticmethod
    def list(
        db: Session,
        patient_id: int | None = None,
        admission_id: int | None = None,
        invoice_status: str | None = None,
    ) -> list[Invoice]:

        query = select(Invoice).order_by(
            Invoice.invoice_date.desc(),
            Invoice.id.desc(),
        )

        if patient_id is not None:
            query = query.where(Invoice.patient_id == patient_id)

        if admission_id is not None:
            query = query.where(Invoice.admission_id == admission_id)

        if invoice_status is not None:
            query = query.where(Invoice.status == invoice_status)

        return list(db.scalars(query).all())

    @staticmethod
    def update(
        db: Session,
        invoice_id: int,
        data: InvoiceUpdate,
    ) -> Invoice:

        invoice = InvoiceService.get(db, invoice_id)

        values = data.model_dump(exclude_unset=True)

        new_patient_id = values.get(
            "patient_id",
            invoice.patient_id,
        )

        new_admission_id = values.get(
            "admission_id",
            invoice.admission_id,
        )

        InvoiceService._validate_references(
            db,
            new_patient_id,
            new_admission_id,
        )

        new_invoice_number = values.get(
            "invoice_number",
            invoice.invoice_number,
        )

        duplicate = db.scalar(
            select(Invoice).where(
                Invoice.invoice_number == new_invoice_number,
                Invoice.id != invoice_id,
            )
        )

        if duplicate:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Invoice number already exists.",
            )

        subtotal = values.get("subtotal", invoice.subtotal)
        tax_amount = values.get("tax_amount", invoice.tax_amount)
        discount_amount = values.get(
            "discount_amount",
            invoice.discount_amount,
        )
        total_amount = values.get(
            "total_amount",
            invoice.total_amount,
        )
        paid_amount = values.get(
            "paid_amount",
            invoice.paid_amount,
        )

        InvoiceService._validate_amounts(
            subtotal,
            tax_amount,
            discount_amount,
            total_amount,
            paid_amount,
        )

        for field, value in values.items():
            if field not in {
                "balance_amount",
                "status",
            }:
                setattr(invoice, field, value)

        invoice.balance_amount = total_amount - paid_amount
        invoice.status = InvoiceService._calculate_status(
            total_amount,
            paid_amount,
        )

        db.commit()
        db.refresh(invoice)

        return invoice

    @staticmethod
    def delete(
        db: Session,
        invoice_id: int,
    ) -> None:

        invoice = InvoiceService.get(db, invoice_id)

        if invoice.payments:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invoice with payments cannot be deleted.",
            )

        db.delete(invoice)
        db.commit()
