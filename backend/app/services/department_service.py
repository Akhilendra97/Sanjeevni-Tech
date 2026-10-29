from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.models.department import Department


def get_department_by_id(
    db: Session,
    department_id: int,
) -> Department | None:
    return db.scalar(
        select(Department).where(
            Department.id == department_id
        )
    )


def get_department_by_name(
    db: Session,
    name: str,
) -> Department | None:
    return db.scalar(
        select(Department).where(
            Department.name == name
        )
    )


def get_department_by_code(
    db: Session,
    code: str,
) -> Department | None:
    return db.scalar(
        select(Department).where(
            Department.code == code
        )
    )


def create_department(
    db: Session,
    *,
    name: str,
    code: str,
    description: str | None,
    location: str | None,
    contact_number: str | None,
) -> Department:

    normalized_name = name.strip()
    normalized_code = code.strip().upper()

    existing = db.scalar(
        select(Department).where(
            or_(
                Department.name == normalized_name,
                Department.code == normalized_code,
            )
        )
    )

    if existing is not None:
        if existing.name == normalized_name:
            raise ValueError(
                "Department name is already registered."
            )

        raise ValueError(
            "Department code is already registered."
        )

    department = Department(
        name=normalized_name,
        code=normalized_code,
        description=description.strip()
        if description
        else None,
        location=location.strip()
        if location
        else None,
        contact_number=contact_number.strip()
        if contact_number
        else None,
        is_active=True,
    )

    db.add(department)
    db.commit()
    db.refresh(department)

    return department


def get_departments(
    db: Session,
    *,
    active_only: bool = False,
) -> list[Department]:

    statement = select(Department).order_by(
        Department.name.asc()
    )

    if active_only:
        statement = statement.where(
            Department.is_active.is_(True)
        )

    return list(db.scalars(statement).all())


def update_department(
    db: Session,
    department: Department,
    *,
    name: str | None = None,
    code: str | None = None,
    description: str | None = None,
    location: str | None = None,
    contact_number: str | None = None,
    is_active: bool | None = None,
) -> Department:

    if name is not None:
        normalized_name = name.strip()

        existing = db.scalar(
            select(Department).where(
                Department.name == normalized_name,
                Department.id != department.id,
            )
        )

        if existing is not None:
            raise ValueError(
                "Department name is already registered."
            )

        department.name = normalized_name

    if code is not None:
        normalized_code = code.strip().upper()

        existing = db.scalar(
            select(Department).where(
                Department.code == normalized_code,
                Department.id != department.id,
            )
        )

        if existing is not None:
            raise ValueError(
                "Department code is already registered."
            )

        department.code = normalized_code

    if description is not None:
        department.description = (
            description.strip()
            if description.strip()
            else None
        )

    if location is not None:
        department.location = (
            location.strip()
            if location.strip()
            else None
        )

    if contact_number is not None:
        department.contact_number = (
            contact_number.strip()
            if contact_number.strip()
            else None
        )

    if is_active is not None:
        department.is_active = is_active

    db.commit()
    db.refresh(department)

    return department


def delete_department(
    db: Session,
    department: Department,
) -> None:

    if department.doctors:
        raise ValueError(
            "Department cannot be deleted because doctors "
            "are assigned to it."
        )

    if department.nurses:
        raise ValueError(
            "Department cannot be deleted because nurses "
            "are assigned to it."
        )

    if department.staff_members:
        raise ValueError(
            "Department cannot be deleted because staff "
            "members are assigned to it."
        )

    db.delete(department)
    db.commit()