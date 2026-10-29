from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.medicine import Medicine
from app.schemas.medicine import MedicineCreate, MedicineUpdate


def create_medicine(
    db: Session,
    medicine_data: MedicineCreate,
) -> Medicine:
    medicine = Medicine(
        **medicine_data.model_dump(),
    )

    db.add(medicine)
    db.commit()
    db.refresh(medicine)

    return medicine


def list_medicines(
    db: Session,
    skip: int = 0,
    limit: int = 100,
) -> list[Medicine]:
    statement = (
        select(Medicine)
        .order_by(Medicine.name.asc())
        .offset(skip)
        .limit(limit)
    )

    return list(db.scalars(statement).all())


def get_medicine_by_id(
    db: Session,
    medicine_id: int,
) -> Medicine | None:
    return db.get(Medicine, medicine_id)


def update_medicine(
    db: Session,
    medicine: Medicine,
    medicine_data: MedicineUpdate,
) -> Medicine:
    update_data = medicine_data.model_dump(
        exclude_unset=True,
    )

    for field, value in update_data.items():
        setattr(medicine, field, value)

    db.commit()
    db.refresh(medicine)

    return medicine


def delete_medicine(
    db: Session,
    medicine: Medicine,
) -> None:
    db.delete(medicine)
    db.commit()


def get_low_stock_medicines(
    db: Session,
) -> list[Medicine]:
    statement = (
        select(Medicine)
        .where(
            Medicine.stock_quantity <= Medicine.reorder_level,
            Medicine.is_active.is_(True),
        )
        .order_by(Medicine.stock_quantity.asc())
    )

    return list(db.scalars(statement).all())


def get_expired_medicines(
    db: Session,
) -> list[Medicine]:
    from datetime import datetime, timezone

    now = datetime.now(timezone.utc)

    statement = (
        select(Medicine)
        .where(
            Medicine.expiry_date.is_not(None),
            Medicine.expiry_date < now,
            Medicine.is_active.is_(True),
        )
        .order_by(Medicine.expiry_date.asc())
    )

    return list(db.scalars(statement).all())