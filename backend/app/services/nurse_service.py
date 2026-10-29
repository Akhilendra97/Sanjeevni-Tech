from datetime import date

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.nurse import Nurse
from app.models.user import User


def create_nurse(
    db: Session,
    *,
    user_id: int,
    department_id: int,
    employee_id: str,
    nursing_registration_number: str,
    qualification: str,
    full_name: str | None = None,
    joining_date: date | None = None,
    is_available: bool = True,
) -> Nurse:

    existing_employee = db.scalar(
        select(Nurse).where(
            Nurse.employee_id == employee_id,
        )
    )

    if existing_employee:
        raise ValueError(
            "Nurse employee ID already exists."
        )

    existing_registration = db.scalar(
        select(Nurse).where(
            Nurse.nursing_registration_number
            == nursing_registration_number,
        )
    )

    if existing_registration:
        raise ValueError(
            "Nursing registration number already exists."
        )

    existing_user = db.scalar(
        select(Nurse).where(
            Nurse.user_id == user_id,
        )
    )

    if existing_user:
        raise ValueError(
            "This user already has a nurse profile."
        )

    linked_user = db.get(User, user_id)
    if linked_user is None:
        raise ValueError("Selected user account does not exist.")

    if full_name is not None:
        normalized_name = full_name.strip()
        if len(normalized_name) < 2:
            raise ValueError("Full name must contain at least 2 characters.")
        linked_user.full_name = normalized_name

    nurse = Nurse(
        user_id=user_id,
        department_id=department_id,
        employee_id=employee_id,
        nursing_registration_number=nursing_registration_number,
        qualification=qualification,
        joining_date=joining_date,
        is_available=is_available,
    )

    db.add(nurse)

    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise ValueError(
            "Unable to create nurse profile."
        ) from exc

    db.refresh(nurse)

    return nurse


def get_nurse_by_id(
    db: Session,
    nurse_id: int,
) -> Nurse | None:

    return db.scalar(
        select(Nurse).where(
            Nurse.id == nurse_id,
        )
    )


def list_nurses(
    db: Session,
) -> list[Nurse]:

    return list(
        db.scalars(
            select(Nurse).order_by(
                Nurse.id.desc()
            )
        ).all()
    )


def update_nurse(
    db: Session,
    nurse: Nurse,
    *,
    user_id: int | None = None,
    full_name: str | None = None,
    department_id: int | None = None,
    employee_id: str | None = None,
    nursing_registration_number: str | None = None,
    qualification: str | None = None,
    joining_date: date | None = None,
    is_available: bool | None = None,
) -> Nurse:

    if user_id is not None:
        existing = db.scalar(
            select(Nurse).where(
                Nurse.user_id == user_id,
                Nurse.id != nurse.id,
            )
        )

        if existing:
            raise ValueError(
                "This user already has a nurse profile."
            )

        nurse.user_id = user_id

    if department_id is not None:
        nurse.department_id = department_id

    if employee_id is not None:
        existing = db.scalar(
            select(Nurse).where(
                Nurse.employee_id == employee_id,
                Nurse.id != nurse.id,
            )
        )

        if existing:
            raise ValueError(
                "Nurse employee ID already exists."
            )

        nurse.employee_id = employee_id

    if nursing_registration_number is not None:
        existing = db.scalar(
            select(Nurse).where(
                Nurse.nursing_registration_number
                == nursing_registration_number,
                Nurse.id != nurse.id,
            )
        )

        if existing:
            raise ValueError(
                "Nursing registration number already exists."
            )

        nurse.nursing_registration_number = (
            nursing_registration_number
        )

    if qualification is not None:
        nurse.qualification = qualification

    if joining_date is not None:
        nurse.joining_date = joining_date

    if is_available is not None:
        nurse.is_available = is_available

    if full_name is not None:
        normalized_name = full_name.strip()
        if len(normalized_name) < 2:
            raise ValueError("Full name must contain at least 2 characters.")

        linked_user = db.get(User, nurse.user_id)
        if linked_user is None:
            raise ValueError("Linked user account was not found.")

        linked_user.full_name = normalized_name

    db.commit()
    db.refresh(nurse)

    return nurse


def delete_nurse(
    db: Session,
    nurse: Nurse,
) -> None:

    db.delete(nurse)
    db.commit()