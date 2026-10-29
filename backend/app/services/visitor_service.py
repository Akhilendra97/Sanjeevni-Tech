from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.patient import Patient
from app.models.visitor import Visitor
from app.schemas.visitor import VisitorCreate, VisitorUpdate


VALID_STATUSES = {
    "checked_in",
    "checked_out",
    "cancelled",
}


def _validate_status(status: str) -> None:
    if status not in VALID_STATUSES:
        raise ValueError(
            f"Invalid visitor status. Allowed values: "
            f"{', '.join(sorted(VALID_STATUSES))}"
        )


def _validate_patient(
    db: Session,
    patient_id: int,
) -> None:
    if db.get(Patient, patient_id) is None:
        raise ValueError("Patient not found")


def _validate_unique_visitor_number(
    db: Session,
    visitor_number: str,
    exclude_id: int | None = None,
) -> None:
    statement = select(Visitor).where(
        Visitor.visitor_number == visitor_number
    )

    if exclude_id is not None:
        statement = statement.where(
            Visitor.id != exclude_id
        )

    if db.scalar(statement) is not None:
        raise ValueError(
            "Visitor number already exists"
        )


def _validate_time_range(
    entry_time: datetime,
    exit_time: datetime | None,
) -> None:
    if exit_time is not None and exit_time < entry_time:
        raise ValueError(
            "Exit time cannot be earlier than entry time"
        )


def create_visitor(
    db: Session,
    visitor_data: VisitorCreate,
) -> Visitor:
    _validate_unique_visitor_number(
        db,
        visitor_data.visitor_number,
    )

    _validate_patient(
        db,
        visitor_data.patient_id,
    )

    _validate_status(
        visitor_data.status,
    )

    _validate_time_range(
        visitor_data.entry_time,
        visitor_data.exit_time,
    )

    visitor = Visitor(
        visitor_number=visitor_data.visitor_number,
        patient_id=visitor_data.patient_id,
        visitor_name=visitor_data.visitor_name,
        relationship_to_patient=(
            visitor_data.relationship_to_patient
        ),
        contact_number=visitor_data.contact_number,
        id_proof_type=visitor_data.id_proof_type,
        id_proof_number=visitor_data.id_proof_number,
        purpose=visitor_data.purpose,
        entry_time=visitor_data.entry_time,
        exit_time=visitor_data.exit_time,
        status=visitor_data.status,
        notes=visitor_data.notes,
    )

    db.add(visitor)
    db.commit()
    db.refresh(visitor)

    return visitor


def get_visitor(
    db: Session,
    visitor_id: int,
) -> Visitor | None:
    return db.get(Visitor, visitor_id)


def get_visitor_by_number(
    db: Session,
    visitor_number: str,
) -> Visitor | None:
    statement = select(Visitor).where(
        Visitor.visitor_number == visitor_number
    )

    return db.scalar(statement)


def list_visitors(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    status: str | None = None,
    patient_id: int | None = None,
) -> list[Visitor]:
    statement = select(Visitor)

    if status is not None:
        _validate_status(status)
        statement = statement.where(
            Visitor.status == status
        )

    if patient_id is not None:
        _validate_patient(
            db,
            patient_id,
        )
        statement = statement.where(
            Visitor.patient_id == patient_id
        )

    statement = (
        statement
        .order_by(Visitor.id.desc())
        .offset(skip)
        .limit(limit)
    )

    return list(db.scalars(statement).all())


def update_visitor(
    db: Session,
    visitor_id: int,
    visitor_data: VisitorUpdate,
) -> Visitor | None:
    visitor = db.get(Visitor, visitor_id)

    if visitor is None:
        return None

    update_data = visitor_data.model_dump(
        exclude_unset=True
    )

    if "visitor_number" in update_data:
        _validate_unique_visitor_number(
            db,
            update_data["visitor_number"],
            exclude_id=visitor_id,
        )

    if "patient_id" in update_data:
        _validate_patient(
            db,
            update_data["patient_id"],
        )

    if "status" in update_data:
        _validate_status(
            update_data["status"]
        )

    entry_time = update_data.get(
        "entry_time",
        visitor.entry_time,
    )

    exit_time = update_data.get(
        "exit_time",
        visitor.exit_time,
    )

    _validate_time_range(
        entry_time,
        exit_time,
    )

    for field, value in update_data.items():
        setattr(visitor, field, value)

    db.commit()
    db.refresh(visitor)

    return visitor


def check_in_visitor(
    db: Session,
    visitor_id: int,
    entry_time: datetime | None = None,
) -> Visitor | None:
    visitor = db.get(Visitor, visitor_id)

    if visitor is None:
        return None

    if visitor.status == "checked_in":
        raise ValueError(
            "Visitor is already checked in"
        )

    if visitor.status == "cancelled":
        raise ValueError(
            "Cancelled visitor cannot be checked in"
        )

    visitor.entry_time = (
        entry_time
        or datetime.now(timezone.utc)
    )
    visitor.exit_time = None
    visitor.status = "checked_in"

    db.commit()
    db.refresh(visitor)

    return visitor


def check_out_visitor(
    db: Session,
    visitor_id: int,
    exit_time: datetime | None = None,
) -> Visitor | None:
    visitor = db.get(Visitor, visitor_id)

    if visitor is None:
        return None

    if visitor.status != "checked_in":
        raise ValueError(
            "Visitor is not currently checked in"
        )

    final_exit_time = (
        exit_time
        or datetime.now(timezone.utc)
    )

    _validate_time_range(
        visitor.entry_time,
        final_exit_time,
    )

    visitor.exit_time = final_exit_time
    visitor.status = "checked_out"

    db.commit()
    db.refresh(visitor)

    return visitor


def cancel_visitor(
    db: Session,
    visitor_id: int,
) -> Visitor | None:
    visitor = db.get(Visitor, visitor_id)

    if visitor is None:
        return None

    if visitor.status == "checked_out":
        raise ValueError(
            "Checked-out visitor cannot be cancelled"
        )

    visitor.status = "cancelled"

    db.commit()
    db.refresh(visitor)

    return visitor


def delete_visitor(
    db: Session,
    visitor_id: int,
) -> bool:
    visitor = db.get(Visitor, visitor_id)

    if visitor is None:
        return False

    db.delete(visitor)
    db.commit()

    return True
