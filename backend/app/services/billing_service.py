from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.billing import Billing


def create_billing(
    db: Session,
    *,
    patient_id: int,
    bill_number: str,
    bill_date,
    bill_type: str,
    description: str | None = None,
    subtotal: float = 0,
    discount: float = 0,
    tax: float = 0,
    total_amount: float = 0,
    paid_amount: float = 0,
    payment_status: str = "pending",
    payment_method: str | None = None,
    notes: str | None = None,
) -> Billing:

    existing = db.scalar(
        select(Billing).where(
            Billing.bill_number == bill_number
        )
    )

    if existing is not None:
        raise ValueError("Bill number already exists.")

    billing = Billing(
        patient_id=patient_id,
        bill_number=bill_number,
        bill_date=bill_date,
        bill_type=bill_type,
        description=description,
        subtotal=subtotal,
        discount=discount,
        tax=tax,
        total_amount=total_amount,
        paid_amount=paid_amount,
        payment_status=payment_status,
        payment_method=payment_method,
        notes=notes,
    )

    db.add(billing)
    db.commit()
    db.refresh(billing)

    return billing


def list_billings(
    db: Session,
) -> list[Billing]:

    return list(
        db.scalars(
            select(Billing).order_by(
                Billing.id.desc()
            )
        ).all()
    )


def get_billing_by_id(
    db: Session,
    billing_id: int,
) -> Billing | None:

    return db.get(Billing, billing_id)


def update_billing(
    db: Session,
    billing: Billing,
    **updates,
) -> Billing:

    for field, value in updates.items():
        if value is not None:
            setattr(billing, field, value)

    db.commit()
    db.refresh(billing)

    return billing


def delete_billing(
    db: Session,
    billing: Billing,
) -> None:

    db.delete(billing)
    db.commit()