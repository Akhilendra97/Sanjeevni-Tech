from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.blood_bank import BloodBank
from app.models.blood_request import BloodRequest
from app.models.blood_unit import BloodUnit
from app.schemas.blood_bank import BloodBankCreate, BloodBankUpdate
from app.schemas.blood_request import BloodRequestCreate, BloodRequestUpdate
from app.schemas.blood_unit import BloodUnitCreate, BloodUnitUpdate


# =========================================================
# BLOOD BANK
# =========================================================

def create_blood_bank(
    db: Session,
    data: BloodBankCreate,
) -> BloodBank:
    existing = db.scalar(
        select(BloodBank).where(
            (BloodBank.name == data.name)
            | (BloodBank.code == data.code)
        )
    )

    if existing:
        raise ValueError(
            "Blood bank with the same name or code already exists."
        )

    blood_bank = BloodBank(**data.model_dump())

    db.add(blood_bank)
    db.commit()
    db.refresh(blood_bank)

    return blood_bank


def get_blood_bank_by_id(
    db: Session,
    blood_bank_id: int,
) -> BloodBank | None:
    return db.get(BloodBank, blood_bank_id)


def list_blood_banks(
    db: Session,
) -> list[BloodBank]:
    statement = select(BloodBank).order_by(
        BloodBank.id.desc()
    )

    return list(db.scalars(statement).all())


def update_blood_bank(
    db: Session,
    blood_bank: BloodBank,
    data: BloodBankUpdate,
) -> BloodBank:
    updates = data.model_dump(exclude_unset=True)

    if "name" in updates or "code" in updates:
        conditions = []

        if "name" in updates:
            conditions.append(
                BloodBank.name == updates["name"]
            )

        if "code" in updates:
            conditions.append(
                BloodBank.code == updates["code"]
            )

        existing = db.scalar(
            select(BloodBank).where(
                *conditions,
                BloodBank.id != blood_bank.id,
            )
        )

        if existing:
            raise ValueError(
                "Another blood bank with the same name or code already exists."
            )

    for field, value in updates.items():
        setattr(blood_bank, field, value)

    db.commit()
    db.refresh(blood_bank)

    return blood_bank


def delete_blood_bank(
    db: Session,
    blood_bank: BloodBank,
) -> None:
    db.delete(blood_bank)
    db.commit()


# =========================================================
# BLOOD REQUEST
# =========================================================

def create_blood_request(
    db: Session,
    data: BloodRequestCreate,
) -> BloodRequest:
    request = BloodRequest(**data.model_dump())

    db.add(request)
    db.commit()
    db.refresh(request)

    return request


def get_blood_request_by_id(
    db: Session,
    request_id: int,
) -> BloodRequest | None:
    return db.get(BloodRequest, request_id)


def list_blood_requests(
    db: Session,
) -> list[BloodRequest]:
    statement = select(BloodRequest).order_by(
        BloodRequest.id.desc()
    )

    return list(db.scalars(statement).all())


def update_blood_request(
    db: Session,
    request: BloodRequest,
    data: BloodRequestUpdate,
) -> BloodRequest:
    updates = data.model_dump(exclude_unset=True)

    for field, value in updates.items():
        setattr(request, field, value)

    db.commit()
    db.refresh(request)

    return request


def delete_blood_request(
    db: Session,
    request: BloodRequest,
) -> None:
    db.delete(request)
    db.commit()


# =========================================================
# BLOOD UNIT
# =========================================================

def create_blood_unit(
    db: Session,
    data: BloodUnitCreate,
) -> BloodUnit:
    unit = BloodUnit(**data.model_dump())

    db.add(unit)
    db.commit()
    db.refresh(unit)

    return unit


def get_blood_unit_by_id(
    db: Session,
    unit_id: int,
) -> BloodUnit | None:
    return db.get(BloodUnit, unit_id)


def list_blood_units(
    db: Session,
) -> list[BloodUnit]:
    statement = select(BloodUnit).order_by(
        BloodUnit.id.desc()
    )

    return list(db.scalars(statement).all())


def update_blood_unit(
    db: Session,
    unit: BloodUnit,
    data: BloodUnitUpdate,
) -> BloodUnit:
    updates = data.model_dump(exclude_unset=True)

    for field, value in updates.items():
        setattr(unit, field, value)

    db.commit()
    db.refresh(unit)

    return unit


def delete_blood_unit(
    db: Session,
    unit: BloodUnit,
) -> None:
    db.delete(unit)
    db.commit()