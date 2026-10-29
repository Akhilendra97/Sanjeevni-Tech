from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.models.patient import Patient
from app.models.role import Role
from app.models.user import User
from app.core.constants import AccountStatus, UserRole


def get_patient_by_id(
    db: Session,
    patient_id: int,
) -> Patient | None:
    return db.scalar(
        select(Patient).where(
            Patient.id == patient_id,
        )
    )


def get_patient_by_number(
    db: Session,
    patient_number: str,
) -> Patient | None:
    return db.scalar(
        select(Patient).where(
            Patient.patient_number == patient_number,
        )
    )


def get_patients(
    db: Session,
    *,
    skip: int = 0,
    limit: int = 100,
    search: str | None = None,
    is_active: bool | None = True,
) -> list[Patient]:
    statement = select(Patient)

    if is_active is not None:
        statement = statement.where(Patient.is_active.is_(is_active))

    if search:
        search_value = f"%{search.strip()}%"

        statement = statement.where(
            or_(
                Patient.patient_number.ilike(search_value),
                Patient.first_name.ilike(search_value),
                Patient.middle_name.ilike(search_value),
                Patient.last_name.ilike(search_value),
                Patient.phone.ilike(search_value),
                Patient.email.ilike(search_value),
            )
        )

    statement = (
        statement
        .order_by(Patient.id.desc())
        .offset(skip)
        .limit(limit)
    )

    return list(db.scalars(statement).all())


def create_patient(
    db: Session,
    *,
    data: dict,
) -> Patient:
    existing_patient = get_patient_by_number(
        db,
        data["patient_number"],
    )

    if existing_patient is not None:
        raise ValueError(
            "Patient number is already registered."
        )

    # Link only when receptionist supplied BOTH exact email and phone that
    # belong to an active patient account with no existing profile. Never
    # link by name or by a single contact field.
    supplied_email = (data.get("email") or "").strip().lower()
    supplied_phone = (data.get("phone") or "").strip()
    if data.get("user_id") is not None:
        candidate = db.get(User, data["user_id"])
        if candidate is None or candidate.role.name != UserRole.PATIENT.value:
            raise ValueError("Selected account is not a valid patient account.")
        if candidate.status != AccountStatus.ACTIVE.value:
            raise ValueError("Selected patient account is not active.")
        if candidate.patient_profile is not None:
            raise ValueError("This patient account is already linked to a profile.")
        if not supplied_email or not supplied_phone or candidate.email.lower() != supplied_email or candidate.phone != supplied_phone:
            raise ValueError("Patient email and phone must exactly match the selected account.")
        data["user_id"] = candidate.id
    elif supplied_email and supplied_phone:
        candidate = db.scalar(
            select(User)
            .join(Role, User.role_id == Role.id)
            .where(
                Role.name == UserRole.PATIENT.value,
                User.status == AccountStatus.ACTIVE.value,
                User.email == supplied_email,
                User.phone == supplied_phone,
            )
        )
        if candidate is not None:
            if candidate.patient_profile is not None:
                raise ValueError("This patient account already has a linked profile.")
            data["user_id"] = candidate.id

    patient = Patient(**data)

    try:
        db.add(patient)
        db.commit()
        db.refresh(patient)
        return patient
    except Exception:
        db.rollback()
        raise


def update_patient(
    db: Session,
    patient: Patient,
    data: dict,
) -> Patient:
    # The router passes model_dump(exclude_unset=True), so keys in data were
    # explicitly supplied by the caller. Preserve explicit None values so an
    # optional field can be cleared; omitted fields are not present in data.
    for field, value in data.items():
        setattr(patient, field, value)

    db.commit()
    db.refresh(patient)

    return patient


def deactivate_patient(
    db: Session,
    patient: Patient,
) -> Patient:
    patient.is_active = False

    db.commit()
    db.refresh(patient)

    return patient