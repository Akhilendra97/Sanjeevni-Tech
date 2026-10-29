from datetime import date

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, selectinload

from app.core.security import hash_password
from app.models.department import Department
from app.models.role import Role
from app.models.staff import Staff
from app.models.user import User


def _staff_query():
    return select(Staff).options(selectinload(Staff.user), selectinload(Staff.department))


def create_staff(
    db: Session, *, department_id: int, employee_id: str, designation: str,
    qualification: str | None = None, joining_date: date | None = None,
    is_available: bool = True, user_id: int | None = None,
    full_name: str | None = None, username: str | None = None,
    email: str | None = None, password: str | None = None, phone: str | None = None,
) -> Staff:
    if db.scalar(select(Staff).where(Staff.employee_id == employee_id)):
        raise ValueError("Staff employee ID already exists.")
    if db.scalar(select(Department.id).where(Department.id == department_id)) is None:
        raise ValueError("Department does not exist.")

    new_user = None
    if user_id is None:
        if not all([full_name, username, email, password]):
            raise ValueError("Full name, username, email and password are required to create a staff login.")
        username = username.strip()
        email = email.strip().lower()
        if db.scalar(select(User.id).where(User.username == username)):
            raise ValueError("Username is already registered.")
        if db.scalar(select(User.id).where(User.email == email)):
            raise ValueError("Email is already registered.")
        normalized_phone = phone.strip() if phone else None
        if normalized_phone and db.scalar(select(User.id).where(User.phone == normalized_phone)):
            raise ValueError("Phone number is already registered.")
        role = db.scalar(select(Role).where(Role.name == "staff", Role.is_active.is_(True)))
        if role is None:
            raise ValueError("Active 'staff' role does not exist. Create/activate it before adding staff.")
        new_user = User(
            username=username, email=email, password_hash=hash_password(password),
            full_name=full_name.strip(), phone=normalized_phone, role_id=role.id,
            status="active", is_verified=True, is_superuser=False,
        )
        db.add(new_user)
        db.flush()
        user_id = new_user.id
    else:
        existing_profile = db.scalar(select(Staff.id).where(Staff.user_id == user_id))
        if existing_profile:
            raise ValueError("This user already has a staff profile.")
        linked_user = db.get(User, user_id)
        if linked_user is None:
            raise ValueError("Linked user account does not exist.")

    staff = Staff(
        user_id=user_id, department_id=department_id, employee_id=employee_id.strip(),
        designation=designation.strip(), qualification=qualification,
        joining_date=joining_date, is_available=is_available,
    )
    db.add(staff)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise ValueError("Unable to create staff profile. Check username, email, phone and employee ID uniqueness.") from exc
    db.refresh(staff)
    return db.scalar(_staff_query().where(Staff.id == staff.id)) or staff


def get_staff_by_id(db: Session, staff_id: int) -> Staff | None:
    return db.scalar(_staff_query().where(Staff.id == staff_id))


def list_staff(db: Session) -> list[Staff]:
    return list(db.scalars(_staff_query().order_by(Staff.id.desc())).all())


def update_staff(
    db: Session, staff: Staff, *, user_id: int | None = None,
    department_id: int | None = None, employee_id: str | None = None,
    designation: str | None = None, qualification: str | None = None,
    joining_date: date | None = None, is_available: bool | None = None,
    full_name: str | None = None, email: str | None = None, phone: str | None = None,
) -> Staff:
    if user_id is not None and user_id != staff.user_id:
        existing = db.scalar(select(Staff.id).where(Staff.user_id == user_id, Staff.id != staff.id))
        if existing:
            raise ValueError("This user already has a staff profile.")
        if db.get(User, user_id) is None:
            raise ValueError("Linked user account does not exist.")
        staff.user_id = user_id

    if department_id is not None:
        if db.get(Department, department_id) is None:
            raise ValueError("Department does not exist.")
        staff.department_id = department_id
    if employee_id is not None:
        existing = db.scalar(select(Staff.id).where(Staff.employee_id == employee_id, Staff.id != staff.id))
        if existing:
            raise ValueError("Staff employee ID already exists.")
        staff.employee_id = employee_id.strip()
    if designation is not None: staff.designation = designation.strip()
    if qualification is not None: staff.qualification = qualification
    if joining_date is not None: staff.joining_date = joining_date
    if is_available is not None: staff.is_available = is_available

    user = staff.user
    if full_name is not None:
        if len(full_name.strip()) < 2: raise ValueError("Full name must contain at least 2 characters.")
        user.full_name = full_name.strip()
    if email is not None:
        normalized_email = str(email).strip().lower()
        duplicate = db.scalar(select(User.id).where(User.email == normalized_email, User.id != user.id))
        if duplicate: raise ValueError("Email is already registered.")
        user.email = normalized_email
    if phone is not None:
        normalized_phone = phone.strip() or None
        if normalized_phone:
            duplicate = db.scalar(select(User.id).where(User.phone == normalized_phone, User.id != user.id))
            if duplicate: raise ValueError("Phone number is already registered.")
        user.phone = normalized_phone

    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise ValueError("Unable to update staff profile. Check email/phone uniqueness.") from exc
    return db.scalar(_staff_query().where(Staff.id == staff.id)) or staff


def delete_staff(db: Session, staff: Staff) -> None:
    db.delete(staff)
    db.commit()
