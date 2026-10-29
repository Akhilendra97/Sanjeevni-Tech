from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.supplier import Supplier
from app.schemas.procurement import SupplierCreate, SupplierUpdate


def create_supplier(
    db: Session,
    data: SupplierCreate,
) -> Supplier:
    supplier = Supplier(
        supplier_code=data.supplier_code,
        name=data.name,
        contact_person=data.contact_person,
        phone=data.phone,
        email=data.email,
        address=data.address,
        city=data.city,
        state=data.state,
        postal_code=data.postal_code,
        gst_number=data.gst_number,
        payment_terms=data.payment_terms,
        notes=data.notes,
    )

    db.add(supplier)

    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise ValueError(
            "Supplier code or GST number already exists."
        ) from exc

    db.refresh(supplier)

    return supplier


def get_supplier_by_id(
    db: Session,
    supplier_id: int,
) -> Supplier | None:
    return db.scalar(
        select(Supplier).where(
            Supplier.id == supplier_id
        )
    )


def get_supplier_by_code(
    db: Session,
    supplier_code: str,
) -> Supplier | None:
    return db.scalar(
        select(Supplier).where(
            Supplier.supplier_code == supplier_code
        )
    )


def list_suppliers(
    db: Session,
) -> list[Supplier]:
    statement = (
        select(Supplier)
        .order_by(Supplier.name.asc())
    )

    return list(db.scalars(statement).all())


def list_active_suppliers(
    db: Session,
) -> list[Supplier]:
    statement = (
        select(Supplier)
        .where(Supplier.is_active.is_(True))
        .order_by(Supplier.name.asc())
    )

    return list(db.scalars(statement).all())


def update_supplier(
    db: Session,
    supplier: Supplier,
    data: SupplierUpdate,
) -> Supplier:
    update_data = data.model_dump(
        exclude_unset=True
    )

    for field, value in update_data.items():
        setattr(supplier, field, value)

    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise ValueError(
            "Supplier update violates a unique constraint."
        ) from exc

    db.refresh(supplier)

    return supplier


def delete_supplier(
    db: Session,
    supplier: Supplier,
) -> None:
    supplier.is_active = False

    db.commit()
    db.refresh(supplier)
