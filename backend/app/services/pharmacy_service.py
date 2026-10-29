from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.department import Department
from app.models.pharmacy import Pharmacy
from app.models.user import User
from app.schemas.pharmacy import PharmacyCreate, PharmacyUpdate


VALID_PHARMACY_TYPES = {
    "main",
    "inpatient",
    "outpatient",
    "emergency",
    "satellite",
}

VALID_STATUSES = {
    "active",
    "inactive",
    "maintenance",
}


def _validate_pharmacy_type(pharmacy_type: str) -> None:
    if pharmacy_type not in VALID_PHARMACY_TYPES:
        raise ValueError(
            f"Invalid pharmacy type. Allowed values: "
            f"{', '.join(sorted(VALID_PHARMACY_TYPES))}"
        )


def _validate_status(status: str) -> None:
    if status not in VALID_STATUSES:
        raise ValueError(
            f"Invalid pharmacy status. Allowed values: "
            f"{', '.join(sorted(VALID_STATUSES))}"
        )


def _validate_department(
    db: Session,
    department_id: int | None,
) -> None:
    if department_id is None:
        return

    department = db.get(Department, department_id)

    if department is None:
        raise ValueError("Department not found")


def _validate_manager(
    db: Session,
    managed_by: int | None,
) -> None:
    if managed_by is None:
        return

    user = db.get(User, managed_by)

    if user is None:
        raise ValueError("Managing user not found")


def _validate_unique_pharmacy_number(
    db: Session,
    pharmacy_number: str,
    exclude_id: int | None = None,
) -> None:
    statement = select(Pharmacy).where(
        Pharmacy.pharmacy_number == pharmacy_number
    )

    if exclude_id is not None:
        statement = statement.where(
            Pharmacy.id != exclude_id
        )

    existing = db.scalar(statement)

    if existing is not None:
        raise ValueError(
            "Pharmacy number already exists"
        )


def create_pharmacy(
    db: Session,
    pharmacy_data: PharmacyCreate,
) -> Pharmacy:
    _validate_unique_pharmacy_number(
        db,
        pharmacy_data.pharmacy_number,
    )

    _validate_pharmacy_type(
        pharmacy_data.pharmacy_type,
    )

    _validate_status(
        pharmacy_data.status,
    )

    _validate_department(
        db,
        pharmacy_data.department_id,
    )

    _validate_manager(
        db,
        pharmacy_data.managed_by,
    )

    pharmacy = Pharmacy(
        pharmacy_number=pharmacy_data.pharmacy_number,
        pharmacy_name=pharmacy_data.pharmacy_name,
        department_id=pharmacy_data.department_id,
        managed_by=pharmacy_data.managed_by,
        pharmacy_type=pharmacy_data.pharmacy_type,
        location=pharmacy_data.location,
        contact_number=pharmacy_data.contact_number,
        operating_hours=pharmacy_data.operating_hours,
        status=pharmacy_data.status,
        notes=pharmacy_data.notes,
    )

    db.add(pharmacy)
    db.commit()
    db.refresh(pharmacy)

    return pharmacy


def get_pharmacy(
    db: Session,
    pharmacy_id: int,
) -> Pharmacy | None:
    return db.get(Pharmacy, pharmacy_id)


def get_pharmacy_by_number(
    db: Session,
    pharmacy_number: str,
) -> Pharmacy | None:
    statement = select(Pharmacy).where(
        Pharmacy.pharmacy_number == pharmacy_number
    )

    return db.scalar(statement)


def list_pharmacies(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    status: str | None = None,
    pharmacy_type: str | None = None,
    department_id: int | None = None,
) -> list[Pharmacy]:
    statement = select(Pharmacy)

    if status is not None:
        _validate_status(status)
        statement = statement.where(
            Pharmacy.status == status
        )

    if pharmacy_type is not None:
        _validate_pharmacy_type(pharmacy_type)
        statement = statement.where(
            Pharmacy.pharmacy_type == pharmacy_type
        )

    if department_id is not None:
        statement = statement.where(
            Pharmacy.department_id == department_id
        )

    statement = (
        statement
        .order_by(Pharmacy.id.desc())
        .offset(skip)
        .limit(limit)
    )

    return list(db.scalars(statement).all())


def update_pharmacy(
    db: Session,
    pharmacy_id: int,
    pharmacy_data: PharmacyUpdate,
) -> Pharmacy | None:
    pharmacy = db.get(Pharmacy, pharmacy_id)

    if pharmacy is None:
        return None

    update_data = pharmacy_data.model_dump(
        exclude_unset=True
    )

    if "pharmacy_number" in update_data:
        _validate_unique_pharmacy_number(
            db,
            update_data["pharmacy_number"],
            exclude_id=pharmacy_id,
        )

    if "pharmacy_type" in update_data:
        _validate_pharmacy_type(
            update_data["pharmacy_type"]
        )

    if "status" in update_data:
        _validate_status(
            update_data["status"]
        )

    if "department_id" in update_data:
        _validate_department(
            db,
            update_data["department_id"],
        )

    if "managed_by" in update_data:
        _validate_manager(
            db,
            update_data["managed_by"],
        )

    for field, value in update_data.items():
        setattr(pharmacy, field, value)

    db.commit()
    db.refresh(pharmacy)

    return pharmacy


def activate_pharmacy(
    db: Session,
    pharmacy_id: int,
) -> Pharmacy | None:
    pharmacy = db.get(Pharmacy, pharmacy_id)

    if pharmacy is None:
        return None

    pharmacy.status = "active"

    db.commit()
    db.refresh(pharmacy)

    return pharmacy


def deactivate_pharmacy(
    db: Session,
    pharmacy_id: int,
) -> Pharmacy | None:
    pharmacy = db.get(Pharmacy, pharmacy_id)

    if pharmacy is None:
        return None

    pharmacy.status = "inactive"

    db.commit()
    db.refresh(pharmacy)

    return pharmacy


def delete_pharmacy(
    db: Session,
    pharmacy_id: int,
) -> bool:
    pharmacy = db.get(Pharmacy, pharmacy_id)

    if pharmacy is None:
        return False

    db.delete(pharmacy)
    db.commit()

    return True
