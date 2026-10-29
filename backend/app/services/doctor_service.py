from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.department import Department
from app.models.doctor import Doctor
from app.models.user import User
from app.schemas.doctor import DoctorCreate, DoctorUpdate


def get_doctor(
    db: Session,
    doctor_id: int,
) -> Doctor | None:
    return db.scalar(
        select(Doctor).where(
            Doctor.id == doctor_id,
        )
    )


def get_doctor_by_employee_id(
    db: Session,
    employee_id: str,
) -> Doctor | None:
    return db.scalar(
        select(Doctor).where(
            Doctor.employee_id == employee_id,
        )
    )


def get_doctor_by_registration_number(
    db: Session,
    registration_number: str,
) -> Doctor | None:
    return db.scalar(
        select(Doctor).where(
            Doctor.registration_number == registration_number,
        )
    )


def get_all_doctors(
    db: Session,
) -> list[Doctor]:
    statement = (
        select(Doctor)
        .order_by(Doctor.id)
    )

    return list(
        db.scalars(statement).all()
    )


def create_doctor(
    db: Session,
    data: DoctorCreate,
) -> Doctor:

    user = db.get(
        User,
        data.user_id,
    )

    if user is None:
        raise ValueError(
            "User does not exist."
        )

    department = db.get(
        Department,
        data.department_id,
    )

    if department is None:
        raise ValueError(
            "Department does not exist."
        )

    if get_doctor_by_employee_id(
        db,
        data.employee_id,
    ):
        raise ValueError(
            "Employee ID is already registered."
        )

    if get_doctor_by_registration_number(
        db,
        data.registration_number,
    ):
        raise ValueError(
            "Registration number is already registered."
        )

    existing_user_doctor = db.scalar(
        select(Doctor).where(
            Doctor.user_id == data.user_id,
        )
    )

    if existing_user_doctor:
        raise ValueError(
            "This user already has a doctor profile."
        )

    user.full_name = data.full_name.strip()

    doctor = Doctor(
        user_id=data.user_id,
        department_id=data.department_id,
        employee_id=data.employee_id.strip(),
        registration_number=data.registration_number.strip(),
        specialization=data.specialization.strip(),
        qualification=data.qualification.strip(),
        experience_years=data.experience_years,
        consultation_fee=data.consultation_fee,
        joining_date=data.joining_date,
        bio=data.bio.strip() if data.bio else None,
        is_available=data.is_available,
    )

    db.add(doctor)
    db.commit()
    db.refresh(doctor)

    return doctor


def update_doctor(
    db: Session,
    doctor: Doctor,
    data: DoctorUpdate,
) -> Doctor:

    update_data = data.model_dump(
        exclude_unset=True
    )

    if "full_name" in update_data:
        full_name = update_data.pop("full_name")
        if full_name is not None:
            cleaned_name = full_name.strip()
            if len(cleaned_name) < 2:
                raise ValueError("Doctor name must contain at least 2 characters.")
            user = db.get(User, doctor.user_id)
            if user is None:
                raise ValueError("The linked user account does not exist.")
            user.full_name = cleaned_name

    if "department_id" in update_data:
        department = db.get(
            Department,
            update_data["department_id"],
        )

        if department is None:
            raise ValueError(
                "Department does not exist."
            )

    if "specialization" in update_data:
        update_data["specialization"] = (
            update_data["specialization"].strip()
        )

    if "qualification" in update_data:
        update_data["qualification"] = (
            update_data["qualification"].strip()
        )

    if "bio" in update_data and update_data["bio"]:
        update_data["bio"] = (
            update_data["bio"].strip()
        )

    for field, value in update_data.items():
        setattr(
            doctor,
            field,
            value,
        )

    db.commit()
    db.refresh(doctor)

    return doctor


def delete_doctor(
    db: Session,
    doctor: Doctor,
) -> None:
    """Deactivate doctors with history; delete only when no dependencies exist."""
    try:
        # Query appointments directly; do not rely on ORM relationship loading.
        from app.models.appointment import Appointment

        has_appointments = (
            db.query(Appointment.id)
            .filter(Appointment.doctor_id == doctor.id)
            .first()
            is not None
        )

        user = getattr(doctor, "user", None)

        if has_appointments:
            # Doctor model has no is_active/availability field in this schema.
            # Keep the profile/history intact and deactivate its login account.
            if user is not None and hasattr(user, "status"):
                user.status = "inactive"
            db.commit()
            return

        db.delete(doctor)
        if user is not None:
            db.delete(user)
        db.commit()

    except Exception:
        db.rollback()
        raise
