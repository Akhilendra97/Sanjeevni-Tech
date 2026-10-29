"""Create fictional demo hospital support staff users and linked Staff profiles.

Run from backend with the project's virtual environment active:
    python scripts/seed_hospital_staff.py

Safe to re-run: existing usernames / employee IDs are not duplicated.
Passwords for newly created accounts are written to
backend/hospital_staff_demo_credentials.csv. Keep that file private.
"""
from __future__ import annotations

import csv
import secrets
import string
import sys
from datetime import date
from pathlib import Path

# Ensure `app` imports work when this script is launched directly from backend.
BACKEND_DIR = Path(__file__).resolve().parents[1]
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.core.constants import AccountStatus, UserRole
from app.core.database import SessionLocal
from app.core.security import hash_password
from app.models import Department, Role, Staff, User


# All records below are fictional demo data, not real hospital employees.
STAFF_DATA = [
    ("Raghav Verma", "Hospital Receptionist", "B.A.", "Administration"),
    ("Meera Kapoor", "Front Desk Executive", "B.Com", "Administration"),
    ("Siddharth Mishra", "Billing Executive", "B.Com", "Finance"),
    ("Nisha Yadav", "Accounts Assistant", "B.Com", "Finance"),
    ("Arjun Saxena", "Medical Records Officer", "B.Sc", "Medical Records"),
    ("Pooja Srivastava", "Medical Records Assistant", "Diploma in Health Records", "Medical Records"),
    ("Karan Gupta", "Laboratory Support Technician", "DMLT", "Laboratory"),
    ("Ishita Pandey", "Pharmacy Store Assistant", "D.Pharm", "Pharmacy"),
    ("Mohit Tiwari", "Inventory Assistant", "B.Com", "Procurement"),
    ("Sana Khan", "Procurement Executive", "BBA", "Procurement"),
    ("Deepak Patel", "Housekeeping Supervisor", "12th Pass", "Housekeeping"),
    ("Kavita Joshi", "Housekeeping Attendant", "10th Pass", "Housekeeping"),
    ("Aman Singh", "Ward Attendant", "12th Pass", "General Medicine"),
    ("Neha Chauhan", "Patient Support Executive", "B.A.", "General Medicine"),
    ("Vivek Sharma", "Security Supervisor", "12th Pass", "Administration"),
    ("Farhan Ali", "Security Officer", "12th Pass", "Administration"),
    ("Anjali Dwivedi", "Biomedical Equipment Assistant", "Diploma in Biomedical Equipment", "Biomedical Engineering"),
    ("Ritesh Kumar", "Facility Maintenance Technician", "ITI Electrician", "Maintenance"),
    ("Priya Soni", "IT Support Executive", "BCA", "Information Technology"),
    ("Manish Raj", "HR Assistant", "MBA HR", "Human Resources"),
    ("Simran Kaur", "Patient Relations Executive", "BBA", "Administration"),
    ("Rahul Chaturvedi", "Transport Coordinator", "B.A.", "Transport"),
    ("Ayesha Siddiqui", "Dietary Services Assistant", "Diploma in Nutrition", "Dietary Services"),
    ("Saurabh Jain", "Central Store Assistant", "B.Com", "Procurement"),
]


def make_password(length: int = 14) -> str:
    alphabet = string.ascii_letters + string.digits + "!@#$%_-"
    while True:
        value = "".join(secrets.choice(alphabet) for _ in range(length))
        if (any(c.islower() for c in value) and any(c.isupper() for c in value)
                and any(c.isdigit() for c in value) and any(c in "!@#$%_-" for c in value)):
            return value


def normalize(value: str) -> str:
    return " ".join(value.casefold().replace("&", "and").split())


def resolve_department(db, preferred_name: str, departments: list[Department]) -> Department:
    target = normalize(preferred_name)
    # Prefer exact match; otherwise select a department whose name contains the key terms.
    for department in departments:
        if normalize(department.name) == target:
            return department
    words = [word for word in target.split() if len(word) > 3]
    for department in departments:
        candidate = normalize(department.name)
        if any(word in candidate or candidate in word for word in words):
            return department
    # Department is required by the schema. A real existing department is safer than
    # creating or guessing an ID; this fallback is logged in the CSV.
    return departments[0]


def main() -> int:
    csv_path = BACKEND_DIR / "hospital_staff_demo_credentials.csv"
    created_rows: list[dict[str, str]] = []
    created_profiles = 0
    existing_profiles = 0
    missing_department_names: set[str] = set()

    with SessionLocal() as db:
        staff_role = db.scalar(
            select(Role).where(Role.name == UserRole.STAFF.value, Role.is_active.is_(True))
        )
        if staff_role is None:
            print("ERROR: Active 'staff' role not found. No records were created.")
            return 2

        departments = list(db.scalars(
            select(Department).where(Department.is_active.is_(True)).order_by(Department.id)
        ).all())
        if not departments:
            print("ERROR: No active departments found. Create departments first.")
            return 2

        for index, (full_name, designation, qualification, preferred_department) in enumerate(STAFF_DATA, 1):
            username = f"staff.demo.{index:03d}"
            email = f"staff.demo.{index:03d}@demo.sanjeevni.local"
            employee_id = f"STF-DEMO-{index:03d}"

            existing_user = db.scalar(
                select(User).options(selectinload(User.role)).where(User.username == username)
            )
            existing_staff = db.scalar(select(Staff).where(Staff.employee_id == employee_id))

            if existing_staff:
                existing_profiles += 1
                continue

            # If a prior partial run created the user but not the staff profile, reuse it.
            if existing_user:
                if existing_user.role.name != UserRole.STAFF.value:
                    print(f"SKIP {username}: username exists with role {existing_user.role.name!r}.")
                    continue
                user = existing_user
                plain_password = ""
            else:
                plain_password = make_password()
                user = User(
                    username=username,
                    email=email,
                    password_hash=hash_password(plain_password),
                    full_name=full_name,
                    phone=None,
                    role_id=staff_role.id,
                    status=AccountStatus.ACTIVE.value,
                    is_verified=True,
                    is_superuser=False,
                )
                db.add(user)
                try:
                    db.flush()
                except Exception as exc:
                    db.rollback()
                    print(f"ERROR creating {username}: {exc}")
                    return 3

            department = resolve_department(db, preferred_department, departments)
            if normalize(department.name) != normalize(preferred_department):
                missing_department_names.add(preferred_department)

            staff = Staff(
                user_id=user.id,
                department_id=department.id,
                employee_id=employee_id,
                designation=designation,
                qualification=qualification,
                joining_date=date(2026, 10, 1),
                is_available=True,
            )
            db.add(staff)
            try:
                db.flush()
                db.commit()
                db.refresh(user)
                db.refresh(staff)
            except Exception as exc:
                db.rollback()
                print(f"ERROR creating profile for {username}: {exc}")
                return 3

            created_profiles += 1
            if plain_password:
                created_rows.append({
                    "full_name": full_name,
                    "username": username,
                    "email": email,
                    "password": plain_password,
                    "employee_id": employee_id,
                    "designation": designation,
                    "department": department.name,
                    "login_role": UserRole.STAFF.value,
                    "login_url": "http://127.0.0.1:5173/login",
                })
            print(f"CREATED: {full_name} | {username} | {employee_id} | {department.name}")

    if created_rows:
        with csv_path.open("w", newline="", encoding="utf-8-sig") as handle:
            writer = csv.DictWriter(handle, fieldnames=list(created_rows[0].keys()))
            writer.writeheader()
            writer.writerows(created_rows)
        print(f"\nCredentials CSV: {csv_path}")
    else:
        print("\nNo new passwords generated; no credentials CSV overwritten.")

    print("\n========== STAFF SEED SUMMARY ==========")
    print(f"Requested demo profiles: {len(STAFF_DATA)}")
    print(f"New staff profiles created: {created_profiles}")
    print(f"Already-existing staff profiles skipped: {existing_profiles}")
    print(f"New login credentials saved: {len(created_rows)}")
    if missing_department_names:
        print("Department names not found; assigned to closest available department:")
        for name in sorted(missing_department_names):
            print(f"  - {name}")
    print("All created staff accounts are fictional demo accounts with role='staff'.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
