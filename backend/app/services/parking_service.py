from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.parking import Parking
from app.models.patient import Patient
from app.models.staff import Staff
from app.schemas.parking import ParkingCreate, ParkingUpdate


VALID_VEHICLE_TYPES = {
    "car",
    "bike",
    "scooter",
    "ambulance",
    "auto",
    "other",
}

VALID_PAYMENT_STATUSES = {
    "pending",
    "paid",
    "waived",
}

VALID_STATUSES = {
    "parked",
    "exited",
    "cancelled",
}


def _validate_vehicle_type(vehicle_type: str) -> None:
    if vehicle_type not in VALID_VEHICLE_TYPES:
        raise ValueError(
            f"Invalid vehicle type. Allowed values: "
            f"{', '.join(sorted(VALID_VEHICLE_TYPES))}"
        )


def _validate_payment_status(payment_status: str) -> None:
    if payment_status not in VALID_PAYMENT_STATUSES:
        raise ValueError(
            f"Invalid payment status. Allowed values: "
            f"{', '.join(sorted(VALID_PAYMENT_STATUSES))}"
        )


def _validate_status(status: str) -> None:
    if status not in VALID_STATUSES:
        raise ValueError(
            f"Invalid parking status. Allowed values: "
            f"{', '.join(sorted(VALID_STATUSES))}"
        )


def _validate_patient(
    db: Session,
    patient_id: int | None,
) -> None:
    if patient_id is None:
        return

    if db.get(Patient, patient_id) is None:
        raise ValueError("Patient not found")


def _validate_staff(
    db: Session,
    staff_id: int | None,
) -> None:
    if staff_id is None:
        return

    if db.get(Staff, staff_id) is None:
        raise ValueError("Staff member not found")


def _validate_unique_parking_number(
    db: Session,
    parking_number: str,
    exclude_id: int | None = None,
) -> None:
    statement = select(Parking).where(
        Parking.parking_number == parking_number
    )

    if exclude_id is not None:
        statement = statement.where(
            Parking.id != exclude_id
        )

    if db.scalar(statement) is not None:
        raise ValueError(
            "Parking number already exists"
        )


def _validate_slot_availability(
    db: Session,
    slot_number: str,
    exclude_id: int | None = None,
) -> None:
    statement = select(Parking).where(
        Parking.slot_number == slot_number,
        Parking.status == "parked",
    )

    if exclude_id is not None:
        statement = statement.where(
            Parking.id != exclude_id
        )

    if db.scalar(statement) is not None:
        raise ValueError(
            "Parking slot is currently occupied"
        )


def _validate_vehicle_availability(
    db: Session,
    vehicle_number: str,
    exclude_id: int | None = None,
) -> None:
    statement = select(Parking).where(
        Parking.vehicle_number == vehicle_number,
        Parking.status == "parked",
    )

    if exclude_id is not None:
        statement = statement.where(
            Parking.id != exclude_id
        )

    if db.scalar(statement) is not None:
        raise ValueError(
            "Vehicle is already parked"
        )


def _validate_time_range(
    entry_time: datetime,
    exit_time: datetime | None,
) -> None:
    if exit_time is not None and exit_time < entry_time:
        raise ValueError(
            "Exit time cannot be earlier than entry time"
        )


def create_parking(
    db: Session,
    parking_data: ParkingCreate,
) -> Parking:
    _validate_unique_parking_number(
        db,
        parking_data.parking_number,
    )

    _validate_vehicle_type(
        parking_data.vehicle_type,
    )

    _validate_payment_status(
        parking_data.payment_status,
    )

    _validate_status(
        parking_data.status,
    )

    _validate_patient(
        db,
        parking_data.patient_id,
    )

    _validate_staff(
        db,
        parking_data.staff_id,
    )

    _validate_time_range(
        parking_data.entry_time,
        parking_data.exit_time,
    )

    if parking_data.status == "parked":
        _validate_slot_availability(
            db,
            parking_data.slot_number,
        )

        _validate_vehicle_availability(
            db,
            parking_data.vehicle_number,
        )

    parking = Parking(
        parking_number=parking_data.parking_number,
        slot_number=parking_data.slot_number,
        vehicle_number=parking_data.vehicle_number,
        vehicle_type=parking_data.vehicle_type,
        patient_id=parking_data.patient_id,
        visitor_name=parking_data.visitor_name,
        visitor_contact=parking_data.visitor_contact,
        staff_id=parking_data.staff_id,
        entry_time=parking_data.entry_time,
        exit_time=parking_data.exit_time,
        parking_fee=parking_data.parking_fee,
        payment_status=parking_data.payment_status,
        status=parking_data.status,
        notes=parking_data.notes,
    )

    db.add(parking)
    db.commit()
    db.refresh(parking)

    return parking


def get_parking(
    db: Session,
    parking_id: int,
) -> Parking | None:
    return db.get(Parking, parking_id)


def get_parking_by_number(
    db: Session,
    parking_number: str,
) -> Parking | None:
    statement = select(Parking).where(
        Parking.parking_number == parking_number
    )

    return db.scalar(statement)


def list_parkings(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    status: str | None = None,
    vehicle_type: str | None = None,
    payment_status: str | None = None,
) -> list[Parking]:
    statement = select(Parking)

    if status is not None:
        _validate_status(status)
        statement = statement.where(
            Parking.status == status
        )

    if vehicle_type is not None:
        _validate_vehicle_type(vehicle_type)
        statement = statement.where(
            Parking.vehicle_type == vehicle_type
        )

    if payment_status is not None:
        _validate_payment_status(payment_status)
        statement = statement.where(
            Parking.payment_status == payment_status
        )

    statement = (
        statement
        .order_by(Parking.id.desc())
        .offset(skip)
        .limit(limit)
    )

    return list(db.scalars(statement).all())


def update_parking(
    db: Session,
    parking_id: int,
    parking_data: ParkingUpdate,
) -> Parking | None:
    parking = db.get(Parking, parking_id)

    if parking is None:
        return None

    update_data = parking_data.model_dump(
        exclude_unset=True
    )

    if "parking_number" in update_data:
        _validate_unique_parking_number(
            db,
            update_data["parking_number"],
            exclude_id=parking_id,
        )

    if "vehicle_type" in update_data:
        _validate_vehicle_type(
            update_data["vehicle_type"]
        )

    if "payment_status" in update_data:
        _validate_payment_status(
            update_data["payment_status"]
        )

    if "status" in update_data:
        _validate_status(
            update_data["status"]
        )

    if "patient_id" in update_data:
        _validate_patient(
            db,
            update_data["patient_id"],
        )

    if "staff_id" in update_data:
        _validate_staff(
            db,
            update_data["staff_id"],
        )

    entry_time = update_data.get(
        "entry_time",
        parking.entry_time,
    )

    exit_time = update_data.get(
        "exit_time",
        parking.exit_time,
    )

    _validate_time_range(
        entry_time,
        exit_time,
    )

    new_slot = update_data.get(
        "slot_number",
        parking.slot_number,
    )

    new_vehicle = update_data.get(
        "vehicle_number",
        parking.vehicle_number,
    )

    new_status = update_data.get(
        "status",
        parking.status,
    )

    if new_status == "parked":
        _validate_slot_availability(
            db,
            new_slot,
            exclude_id=parking_id,
        )

        _validate_vehicle_availability(
            db,
            new_vehicle,
            exclude_id=parking_id,
        )

    for field, value in update_data.items():
        setattr(parking, field, value)

    db.commit()
    db.refresh(parking)

    return parking


def exit_parking(
    db: Session,
    parking_id: int,
    exit_time: datetime | None = None,
) -> Parking | None:
    parking = db.get(Parking, parking_id)

    if parking is None:
        return None

    if parking.status != "parked":
        raise ValueError(
            "Vehicle is not currently parked"
        )

    final_exit_time = (
        exit_time
        or datetime.now(timezone.utc)
    )

    _validate_time_range(
        parking.entry_time,
        final_exit_time,
    )

    parking.exit_time = final_exit_time
    parking.status = "exited"

    db.commit()
    db.refresh(parking)

    return parking


def mark_payment_paid(
    db: Session,
    parking_id: int,
) -> Parking | None:
    parking = db.get(Parking, parking_id)

    if parking is None:
        return None

    parking.payment_status = "paid"

    db.commit()
    db.refresh(parking)

    return parking


def cancel_parking(
    db: Session,
    parking_id: int,
) -> Parking | None:
    parking = db.get(Parking, parking_id)

    if parking is None:
        return None

    if parking.status == "exited":
        raise ValueError(
            "Exited parking record cannot be cancelled"
        )

    parking.status = "cancelled"

    db.commit()
    db.refresh(parking)

    return parking


def delete_parking(
    db: Session,
    parking_id: int,
) -> bool:
    parking = db.get(Parking, parking_id)

    if parking is None:
        return False

    db.delete(parking)
    db.commit()

    return True
