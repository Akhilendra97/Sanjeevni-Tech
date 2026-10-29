from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session, selectinload

from app.core.constants import AccountStatus, UserRole
from app.core.security import hash_password
from app.models.role import Role
from app.models.user import User


VALID_STATUSES = {
    AccountStatus.ACTIVE.value,
    AccountStatus.INACTIVE.value,
    AccountStatus.SUSPENDED.value,
    AccountStatus.PENDING.value,
}


def _normalize_role(role: str) -> str:
    value = role.strip().lower()

    try:
        return UserRole(value).value
    except ValueError as exc:
        raise ValueError(
            f"Invalid role. Allowed roles: "
            f"{', '.join(item.value for item in UserRole)}"
        ) from exc


def _normalize_status(status: str) -> str:
    value = status.strip().lower()

    if value not in VALID_STATUSES:
        raise ValueError(
            f"Invalid status. Allowed statuses: "
            f"{', '.join(sorted(VALID_STATUSES))}"
        )

    return value


def _get_role(db: Session, role_name: str) -> Role:
    role = db.scalar(
        select(Role).where(
            Role.name == role_name,
            Role.is_active.is_(True),
        )
    )

    if role is None:
        raise ValueError(
            f"Role '{role_name}' does not exist or is inactive."
        )

    return role


def _serialize_user(user: User) -> dict:
    return {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "full_name": user.full_name,
        "phone": user.phone,
        "role": user.role.name,
        "status": user.status,
        "is_verified": user.is_verified,
        "is_superuser": user.is_superuser,
        "last_login_at": user.last_login_at,
        "created_at": user.created_at,
        "updated_at": user.updated_at,
    }


def get_users(
    db: Session,
    *,
    search: str | None = None,
    role: str | None = None,
    status: str | None = None,
    page: int = 1,
    page_size: int = 20,
) -> dict:
    page = max(page, 1)
    page_size = min(max(page_size, 1), 100)

    filters = []

    if search and search.strip():
        search_value = f"%{search.strip()}%"
        filters.append(
            or_(
                User.username.ilike(search_value),
                User.email.ilike(search_value),
                User.full_name.ilike(search_value),
                User.phone.ilike(search_value),
            )
        )

    if role:
        filters.append(
            User.role.has(
                Role.name == _normalize_role(role)
            )
        )

    if status:
        filters.append(
            User.status == _normalize_status(status)
        )

    count_statement = select(func.count(User.id))

    if filters:
        count_statement = count_statement.where(*filters)

    total = db.scalar(count_statement) or 0

    statement = (
        select(User)
        .options(selectinload(User.role))
        .order_by(User.created_at.desc(), User.id.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )

    if filters:
        statement = statement.where(*filters)

    users = list(db.scalars(statement).all())

    pages = max((total + page_size - 1) // page_size, 1)

    return {
        "items": [_serialize_user(user) for user in users],
        "total": total,
        "page": page,
        "page_size": page_size,
        "pages": pages,
    }


def get_user(db: Session, user_id: int) -> User | None:
    statement = (
        select(User)
        .options(selectinload(User.role))
        .where(User.id == user_id)
    )

    return db.scalar(statement)


def create_user(
    db: Session,
    *,
    username: str,
    email: str,
    password: str,
    full_name: str,
    phone: str | None,
    role: str,
    status: str,
    is_verified: bool,
) -> dict:
    normalized_username = username.strip()
    normalized_email = email.strip().lower()
    normalized_role = _normalize_role(role)
    normalized_status = _normalize_status(status)
    normalized_phone = phone.strip() if phone else None

    if db.scalar(
        select(User).where(User.username == normalized_username)
    ):
        raise ValueError("Username is already registered.")

    if db.scalar(
        select(User).where(User.email == normalized_email)
    ):
        raise ValueError("Email is already registered.")

    if normalized_phone and db.scalar(
        select(User).where(User.phone == normalized_phone)
    ):
        raise ValueError("Phone number is already registered.")

    role_record = _get_role(db, normalized_role)

    user = User(
        username=normalized_username,
        email=normalized_email,
        password_hash=hash_password(password),
        full_name=full_name.strip(),
        phone=normalized_phone,
        role_id=role_record.id,
        status=normalized_status,
        is_verified=is_verified,
        is_superuser=False,
    )

    try:
        db.add(user)
        db.commit()
        db.refresh(user)
    except Exception:
        db.rollback()
        raise

    user = get_user(db, user.id)

    return _serialize_user(user)


def update_user(
    db: Session,
    user: User,
    *,
    email: str | None = None,
    full_name: str | None = None,
    phone: str | None = None,
    role: str | None = None,
    status: str | None = None,
    is_verified: bool | None = None,
) -> dict:
    if email is not None:
        normalized_email = email.strip().lower()

        existing = db.scalar(
            select(User).where(
                User.email == normalized_email,
                User.id != user.id,
            )
        )

        if existing:
            raise ValueError("Email is already registered.")

        user.email = normalized_email

    if full_name is not None:
        value = full_name.strip()

        if len(value) < 2:
            raise ValueError("Full name must contain at least 2 characters.")

        user.full_name = value

    if phone is not None:
        normalized_phone = phone.strip() or None

        if normalized_phone:
            existing = db.scalar(
                select(User).where(
                    User.phone == normalized_phone,
                    User.id != user.id,
                )
            )

            if existing:
                raise ValueError("Phone number is already registered.")

        user.phone = normalized_phone

    if role is not None:
        normalized_role = _normalize_role(role)
        role_record = _get_role(db, normalized_role)
        user.role_id = role_record.id

    if status is not None:
        user.status = _normalize_status(status)

    if is_verified is not None:
        user.is_verified = is_verified

    try:
        db.commit()
        db.refresh(user)
    except Exception:
        db.rollback()
        raise

    user = get_user(db, user.id)

    return _serialize_user(user)


def reset_password(
    db: Session,
    user: User,
    password: str,
) -> None:
    user.password_hash = hash_password(password)

    try:
        db.commit()
    except Exception:
        db.rollback()
        raise


def set_status(
    db: Session,
    user: User,
    status: str,
) -> dict:
    user.status = _normalize_status(status)

    try:
        db.commit()
        db.refresh(user)
    except Exception:
        db.rollback()
        raise

    user = get_user(db, user.id)

    return _serialize_user(user)
