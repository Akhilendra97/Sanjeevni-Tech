from datetime import date, datetime, timezone

from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.core.constants import AccountStatus, UserRole
from app.core.security import (
    create_access_token,
    hash_password,
    verify_password,
)
from app.models.patient import Patient
from app.models.role import Role
from app.models.user import User


def get_user_by_username_or_email(
    db: Session,
    username_or_email: str,
) -> User | None:
    statement = select(User).where(
        or_(
            User.username == username_or_email,
            User.email == username_or_email,
        )
    )

    return db.scalar(statement)


def get_user_by_username(
    db: Session,
    username: str,
) -> User | None:
    statement = select(User).where(
        User.username == username,
    )

    return db.scalar(statement)


def get_user_by_email(
    db: Session,
    email: str,
) -> User | None:
    statement = select(User).where(
        User.email == email,
    )

    return db.scalar(statement)


def get_role_by_name(
    db: Session,
    role_name: str,
) -> Role | None:
    statement = select(Role).where(
        Role.name == role_name,
        Role.is_active.is_(True),
    )

    return db.scalar(statement)


def _generate_patient_number(db: Session) -> str:
    last_patient = db.scalar(
        select(Patient)
        .order_by(Patient.id.desc())
        .limit(1)
    )

    next_id = (
        (last_patient.id + 1)
        if last_patient is not None
        else 1
    )

    while True:
        patient_number = f"PAT-{next_id:06d}"

        existing = db.scalar(
            select(Patient).where(
                Patient.patient_number == patient_number,
            )
        )

        if existing is None:
            return patient_number

        next_id += 1


def register_user(
    db: Session,
    *,
    username: str,
    email: str,
    password: str,
    full_name: str,
    phone: str | None,
    role_name: str,
    date_of_birth: date | None = None,
    gender: str | None = None,
    blood_group: str | None = None,
    address: str | None = None,
    city: str | None = None,
    state: str | None = None,
    postal_code: str | None = None,
    emergency_contact_name: str | None = None,
    emergency_contact_phone: str | None = None,
    emergency_contact_relation: str | None = None,
) -> User:
    normalized_username = username.strip()
    normalized_email = email.strip().lower()
    normalized_role = role_name.strip().lower()

    existing_username = get_user_by_username(
        db,
        normalized_username,
    )

    if existing_username is not None:
        raise ValueError("Username is already registered.")

    existing_email = get_user_by_email(
        db,
        normalized_email,
    )

    if existing_email is not None:
        raise ValueError("Email is already registered.")

    normalized_phone = phone.strip() if phone else None

    if normalized_phone:
        existing_phone = db.scalar(
            select(User).where(
                User.phone == normalized_phone,
            )
        )

        if existing_phone is not None:
            raise ValueError(
                "Phone number is already registered."
            )

    try:
        user_role = UserRole(normalized_role)
    except ValueError:
        raise ValueError(
            f"Invalid role. Allowed roles: "
            f"{', '.join(role.value for role in UserRole)}"
        )

    # Public self-registration is restricted to patients.
    if user_role != UserRole.PATIENT:
        raise ValueError(
            "Public registration is available only for patients."
        )

    role = get_role_by_name(
        db,
        user_role.value,
    )

    if role is None:
        raise ValueError(
            f"Role '{user_role.value}' does not exist. "
            "Create the role before registering this user."
        )

    # Patient profile requires these fields.
    if date_of_birth is None:
        raise ValueError(
            "Date of birth is required for patient registration."
        )

    if not gender or not gender.strip():
        raise ValueError(
            "Gender is required for patient registration."
        )

    name_parts = full_name.strip().split()

    if len(name_parts) < 2:
        raise ValueError(
            "Patient full name must contain first and last name."
        )

    first_name = name_parts[0]
    last_name = " ".join(name_parts[1:])

    try:
        user = User(
            username=normalized_username,
            email=normalized_email,
            password_hash=hash_password(password),
            full_name=full_name.strip(),
            phone=normalized_phone,
            role_id=role.id,
            status=AccountStatus.ACTIVE.value,
            is_verified=False,
            is_superuser=False,
        )

        db.add(user)
        db.flush()

        patient = Patient(
            user_id=user.id,
            patient_number=_generate_patient_number(db),
            first_name=first_name,
            last_name=last_name,
            date_of_birth=date_of_birth,
            gender=gender.strip(),
            blood_group=blood_group.strip()
            if blood_group
            else None,
            phone=normalized_phone or "",
            email=normalized_email,
            address=address,
            city=city,
            state=state,
            postal_code=postal_code,
            emergency_contact_name=emergency_contact_name,
            emergency_contact_phone=emergency_contact_phone,
            emergency_contact_relation=emergency_contact_relation,
            is_active=True,
        )

        db.add(patient)

        db.commit()
        db.refresh(user)

        return user

    except Exception:
        db.rollback()
        raise


def authenticate_user(
    db: Session,
    username_or_email: str,
    password: str,
) -> User | None:
    user = get_user_by_username_or_email(
        db,
        username_or_email.strip(),
    )

    if user is None:
        return None

    if not verify_password(
        password,
        user.password_hash,
    ):
        return None

    if user.status != AccountStatus.ACTIVE.value:
        return None

    # Record successful login in UTC only after credentials and account status pass.
    user.last_login_at = datetime.now(timezone.utc)
    try:
        db.commit()
        db.refresh(user)
    except Exception:
        db.rollback()
        raise

    return user


def create_user_access_token(
    user: User,
) -> str:
    return create_access_token(
        subject=str(user.id),
        role=user.role.name,
    )
