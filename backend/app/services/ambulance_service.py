from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.ambulance import Ambulance


def create_ambulance(
    db: Session,
    *,
    ambulance_number: str,
    registration_number: str,
    ambulance_type: str,
    department_id: int | None = None,
    driver_name: str | None = None,
    driver_phone: str | None = None,
    equipment_details: str | None = None,
    status: str = "available",
    location: str | None = None,
    is_active: bool = True,
    notes: str | None = None,
) -> Ambulance:
    existing_number = db.scalar(
        select(Ambulance).where(
            Ambulance.ambulance_number == ambulance_number
        )
    )

    if existing_number is not None:
        raise ValueError(
            "Ambulance number already exists."
        )

    existing_registration = db.scalar(
        select(Ambulance).where(
            Ambulance.registration_number == registration_number
        )
    )

    if existing_registration is not None:
        raise ValueError(
            "Registration number already exists."
        )

    ambulance = Ambulance(
        ambulance_number=ambulance_number,
        registration_number=registration_number,
        ambulance_type=ambulance_type,
        department_id=department_id,
        driver_name=driver_name,
        driver_phone=driver_phone,
        equipment_details=equipment_details,
        status=status,
        location=location,
        is_active=is_active,
        notes=notes,
    )

    db.add(ambulance)
    db.commit()
    db.refresh(ambulance)

    return ambulance


def get_ambulance_by_id(
    db: Session,
    ambulance_id: int,
) -> Ambulance | None:
    return db.get(Ambulance, ambulance_id)


def list_ambulances(
    db: Session,
) -> list[Ambulance]:
    statement = select(Ambulance).order_by(
        Ambulance.id.desc()
    )

    return list(
        db.scalars(statement).all()
    )


def update_ambulance(
    db: Session,
    ambulance: Ambulance,
    *,
    ambulance_number: str | None = None,
    registration_number: str | None = None,
    ambulance_type: str | None = None,
    department_id: int | None = None,
    driver_name: str | None = None,
    driver_phone: str | None = None,
    equipment_details: str | None = None,
    status: str | None = None,
    location: str | None = None,
    is_active: bool | None = None,
    notes: str | None = None,
) -> Ambulance:

    if (
        ambulance_number is not None
        and ambulance_number != ambulance.ambulance_number
    ):
        existing = db.scalar(
            select(Ambulance).where(
                Ambulance.ambulance_number == ambulance_number,
                Ambulance.id != ambulance.id,
            )
        )

        if existing is not None:
            raise ValueError(
                "Ambulance number already exists."
            )

        ambulance.ambulance_number = ambulance_number

    if (
        registration_number is not None
        and registration_number != ambulance.registration_number
    ):
        existing = db.scalar(
            select(Ambulance).where(
                Ambulance.registration_number == registration_number,
                Ambulance.id != ambulance.id,
            )
        )

        if existing is not None:
            raise ValueError(
                "Registration number already exists."
            )

        ambulance.registration_number = registration_number

    if ambulance_type is not None:
        ambulance.ambulance_type = ambulance_type

    if department_id is not None:
        ambulance.department_id = department_id

    if driver_name is not None:
        ambulance.driver_name = driver_name

    if driver_phone is not None:
        ambulance.driver_phone = driver_phone

    if equipment_details is not None:
        ambulance.equipment_details = equipment_details

    if status is not None:
        ambulance.status = status

    if location is not None:
        ambulance.location = location

    if is_active is not None:
        ambulance.is_active = is_active

    if notes is not None:
        ambulance.notes = notes

    db.commit()
    db.refresh(ambulance)

    return ambulance


def delete_ambulance(
    db: Session,
    ambulance: Ambulance,
) -> None:
    db.delete(ambulance)
    db.commit()