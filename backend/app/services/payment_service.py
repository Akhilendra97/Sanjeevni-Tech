from decimal import Decimal

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.invoice import Invoice
from app.models.patient import Patient
from app.models.payment import Payment
from app.models.user import User
from app.schemas.payment import PaymentCreate, PaymentUpdate


class PaymentService:

    @staticmethod
    def _validate_references(
        db: Session,
        invoice_id: int,
        patient_id: int,
        received_by: int | None,
    ) -> Invoice:

        invoice = db.get(Invoice, invoice_id)

        if not invoice:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Invoice not found.",
            )

        patient = db.get(Patient, patient_id)

        if not patient:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Patient not found.",
            )

        if invoice.patient_id != patient_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invoice does not belong to the selected patient.",
            )

        if received_by is not None:
            user = db.get(User, received_by)

            if not user:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Receiving user not found.",
                )

        return invoice

    @staticmethod
    def _recalculate_invoice(
        db: Session,
        invoice: Invoice,
    ) -> None:

        completed_payments = db.scalars(
            select(Payment).where(
                Payment.invoice_id == invoice.id,
                Payment.status == "completed",
            )
        ).all()

        paid_amount = sum(
            (payment.amount for payment in completed_payments),
            Decimal("0.00"),
        )

        if paid_amount > invoice.total_amount:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Payments cannot exceed invoice total amount.",
            )

        invoice.paid_amount = paid_amount
        invoice.balance_amount = invoice.total_amount - paid_amount

        if paid_amount <= Decimal("0.00"):
            invoice.status = "unpaid"
        elif paid_amount < invoice.total_amount:
            invoice.status = "partially_paid"
        else:
            invoice.status = "paid"

    @staticmethod
    def create(
        db: Session,
        data: PaymentCreate,
    ) -> Payment:

        duplicate = db.scalar(
            select(Payment).where(
                Payment.payment_number == data.payment_number
            )
        )

        if duplicate:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Payment number already exists.",
            )

        if data.transaction_reference:
            duplicate_reference = db.scalar(
                select(Payment).where(
                    Payment.transaction_reference
                    == data.transaction_reference
                )
            )

            if duplicate_reference:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="Transaction reference already exists.",
                )

        invoice = PaymentService._validate_references(
            db,
            data.invoice_id,
            data.patient_id,
            data.received_by,
        )

        if data.status == "completed":
            current_paid = invoice.paid_amount or Decimal("0.00")

            if current_paid + data.amount > invoice.total_amount:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Payment amount exceeds invoice balance.",
                )

        payment = Payment(
            payment_number=data.payment_number,
            invoice_id=data.invoice_id,
            patient_id=data.patient_id,
            payment_date=data.payment_date,
            amount=data.amount,
            payment_method=data.payment_method,
            transaction_reference=data.transaction_reference,
            status=data.status,
            received_by=data.received_by,
            remarks=data.remarks,
        )

        db.add(payment)

        if data.status == "completed":
            invoice.paid_amount = (
                invoice.paid_amount + data.amount
            )

            invoice.balance_amount = (
                invoice.total_amount - invoice.paid_amount
            )

            if invoice.paid_amount <= Decimal("0.00"):
                invoice.status = "unpaid"
            elif invoice.paid_amount < invoice.total_amount:
                invoice.status = "partially_paid"
            else:
                invoice.status = "paid"

        db.commit()
        db.refresh(payment)

        return payment

    @staticmethod
    def get(
        db: Session,
        payment_id: int,
    ) -> Payment:

        payment = db.get(Payment, payment_id)

        if not payment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Payment not found.",
            )

        return payment

    @staticmethod
    def get_by_number(
        db: Session,
        payment_number: str,
    ) -> Payment:

        payment = db.scalar(
            select(Payment).where(
                Payment.payment_number == payment_number
            )
        )

        if not payment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Payment not found.",
            )

        return payment

    @staticmethod
    def list(
        db: Session,
        invoice_id: int | None = None,
        patient_id: int | None = None,
        payment_status: str | None = None,
    ) -> list[Payment]:

        query = select(Payment).order_by(
            Payment.payment_date.desc(),
            Payment.id.desc(),
        )

        if invoice_id is not None:
            query = query.where(
                Payment.invoice_id == invoice_id
            )

        if patient_id is not None:
            query = query.where(
                Payment.patient_id == patient_id
            )

        if payment_status is not None:
            query = query.where(
                Payment.status == payment_status
            )

        return list(db.scalars(query).all())

    @staticmethod
    def update(
        db: Session,
        payment_id: int,
        data: PaymentUpdate,
    ) -> Payment:

        payment = PaymentService.get(db, payment_id)

        old_invoice = db.get(Invoice, payment.invoice_id)

        values = data.model_dump(exclude_unset=True)

        new_invoice_id = values.get(
            "invoice_id",
            payment.invoice_id,
        )

        new_patient_id = values.get(
            "patient_id",
            payment.patient_id,
        )

        new_received_by = values.get(
            "received_by",
            payment.received_by,
        )

        new_invoice = PaymentService._validate_references(
            db,
            new_invoice_id,
            new_patient_id,
            new_received_by,
        )

        new_payment_number = values.get(
            "payment_number",
            payment.payment_number,
        )

        duplicate = db.scalar(
            select(Payment).where(
                Payment.payment_number == new_payment_number,
                Payment.id != payment_id,
            )
        )

        if duplicate:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Payment number already exists.",
            )

        new_reference = values.get(
            "transaction_reference",
            payment.transaction_reference,
        )

        if new_reference:
            duplicate_reference = db.scalar(
                select(Payment).where(
                    Payment.transaction_reference == new_reference,
                    Payment.id != payment_id,
                )
            )

            if duplicate_reference:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="Transaction reference already exists.",
                )

        new_amount = values.get(
            "amount",
            payment.amount,
        )

        new_status = values.get(
            "status",
            payment.status,
        )

        if new_status == "completed":
            existing_completed = sum(
                (
                    p.amount
                    for p in db.scalars(
                        select(Payment).where(
                            Payment.invoice_id == new_invoice.id,
                            Payment.status == "completed",
                            Payment.id != payment_id,
                        )
                    ).all()
                ),
                Decimal("0.00"),
            )

            if existing_completed + new_amount > new_invoice.total_amount:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Payment amount exceeds invoice balance.",
                )

        for field, value in values.items():
            setattr(payment, field, value)

        db.flush()

        if old_invoice and old_invoice.id != new_invoice.id:
            PaymentService._recalculate_invoice(
                db,
                old_invoice,
            )

        PaymentService._recalculate_invoice(
            db,
            new_invoice,
        )

        db.commit()
        db.refresh(payment)

        return payment

    @staticmethod
    def delete(
        db: Session,
        payment_id: int,
    ) -> None:

        payment = PaymentService.get(db, payment_id)

        invoice = db.get(Invoice, payment.invoice_id)

        db.delete(payment)
        db.flush()

        if invoice:
            PaymentService._recalculate_invoice(
                db,
                invoice,
            )

        db.commit()
