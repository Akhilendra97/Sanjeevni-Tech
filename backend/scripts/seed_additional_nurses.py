"""Create 50 additional demo nurse accounts and linked Nurse profiles.

Run from backend with the project's virtual environment active:
    python scripts/seed_additional_nurses.py

Credentials are exported once to backend/nurse_demo_credentials.csv.
This script is idempotent for the nurse.demo.* username prefix.
"""
from __future__ import annotations

import csv
import secrets
import string
from datetime import date
from pathlib import Path

# BACKEND_ROOT_FOR_SEED: ensure "app" imports work when run as a script.
import sys
_BACKEND_ROOT_FOR_SEED = str(Path(__file__).resolve().parents[1])
if _BACKEND_ROOT_FOR_SEED not in sys.path:
    sys.path.insert(0, _BACKEND_ROOT_FOR_SEED)
from sqlalchemy import select

from app.core.constants import AccountStatus, UserRole
from app.core.database import SessionLocal
from app.core.security import hash_password
from app.models.department import Department
from app.models.nurse import Nurse
from app.models.role import Role
from app.models.user import User

FIRST_NAMES = [
    "Aarohi", "Aditi", "Akanksha", "Ananya", "Anika", "Anjali", "Anushka", "Aparna", "Bhavna", "Charu",
    "Deepa", "Deepika", "Diya", "Esha", "Garima", "Gauri", "Geeta", "Hema", "Ira", "Ishita",
    "Jaya", "Jyoti", "Kajal", "Kavita", "Khushi", "Komal", " Kriti".strip(), "Kusum", "Lavanya", "Madhavi",
    "Mansi", "Meera", "Mitali", "Naina", "Namrata", "Neha", "Nidhi", "Nikita", "Nisha", "Pallavi",
    "Pooja", "Pragya", "Preeti", "Priya", "Radhika", "Rashmi", "Rekha", "Ritu", "Sakshi", "Saloni",
]
LAST_NAMES = [
    "Sharma", "Verma", "Gupta", "Singh", "Mishra", "Yadav", "Agarwal", "Srivastava", "Pandey", "Tiwari",
    "Shukla", "Chauhan", "Saxena", "Jain", "Rao", "Mehta", "Kapoor", "Joshi", "Sinha", "Dubey",
    "Tripathi", "Bansal", "Khan", "Das", "Patel", "Chandra", "Malhotra", "Kumar", "Bose", "Rastogi",
    "Dixit", "Arora", "Thakur", "Mohan", "Kulkarni", "Nair", "Iyer", "Menon", "Ghosh", "Chopra",
    "Pillai", "Desai", "Sethi", "Sood", "Pathak", "Prasad", "Awasthi", "Rawat", "Lal", "Tyagi",
]


def make_password() -> str:
    alphabet = string.ascii_letters + string.digits + "!@#$%"
    while True:
        value = "".join(secrets.choice(alphabet) for _ in range(16))
        if (any(c.islower() for c in value) and any(c.isupper() for c in value)
                and any(c.isdigit() for c in value) and any(c in "!@#$%" for c in value)):
            return value


def main() -> None:
    credentials_path = Path(__file__).resolve().parents[1] / "nurse_demo_credentials.csv"
    created_credentials: list[dict[str, str]] = []
    db = SessionLocal()
    try:
        role = db.scalar(select(Role).where(Role.name == UserRole.NURSE.value, Role.is_active.is_(True)))
        if role is None:
            raise RuntimeError("Active 'nurse' role not found. Seed roles first; no changes made.")
        department = db.scalar(select(Department).where(Department.is_active.is_(True)).order_by(Department.id))
        if department is None:
            raise RuntimeError("No active department found. Create/activate a department first; no changes made.")

        for i in range(50):
            username = f"nurse.demo.{i + 1:03d}"
            email = f"nurse.demo.{i + 1:03d}@example.test"
            existing_user = db.scalar(select(User).where(User.username == username))
            if existing_user:
                # Do not overwrite passwords or modify an existing account/profile.
                if existing_user.nurse_profile is None:
                    employee_id = f"NUR-DEMO-{i + 1:03d}"
                    reg_no = f"DEMO-NREG-{i + 1:03d}"
                    if db.scalar(select(Nurse).where(Nurse.employee_id == employee_id)) is None and db.scalar(select(Nurse).where(Nurse.nursing_registration_number == reg_no)) is None:
                        db.add(Nurse(user_id=existing_user.id, department_id=department.id,
                                     employee_id=employee_id, nursing_registration_number=reg_no,
                                     qualification="B.Sc. Nursing (Demo)", joining_date=date.today(), is_available=True))
                continue

            full_name = f"{FIRST_NAMES[i]} {LAST_NAMES[i]}"
            password = make_password()
            user = User(username=username, email=email, password_hash=hash_password(password),
                        full_name=full_name, phone=None, role_id=role.id,
                        status=AccountStatus.ACTIVE.value, is_verified=True, is_superuser=False)
            db.add(user)
            db.flush()
            db.add(Nurse(user_id=user.id, department_id=department.id,
                         employee_id=f"NUR-DEMO-{i + 1:03d}",
                         nursing_registration_number=f"DEMO-NREG-{i + 1:03d}",
                         qualification="B.Sc. Nursing (Demo)", joining_date=date.today(), is_available=True))
            created_credentials.append({"full_name": full_name, "username": username,
                                        "email": email, "initial_password": password,
                                        "role": "nurse", "department": department.name})

        db.commit()
        if created_credentials:
            with credentials_path.open("w", newline="", encoding="utf-8-sig") as file:
                writer = csv.DictWriter(file, fieldnames=list(created_credentials[0].keys()))
                writer.writeheader()
                writer.writerows(created_credentials)
        print("Seed completed.")
        print("Demo nurse profiles target: 50 (nurse.demo.001 through nurse.demo.050), in addition to existing nurses.")
        print(f"New accounts created this run: {len(created_credentials)}")
        if created_credentials:
            print(f"Initial credentials exported to: {credentials_path}")
        else:
            print("No new accounts created; existing demo accounts were left unchanged.")
        print(f"Department used: {department.name} (ID {department.id})")
        print("IMPORTANT: These are fictional DEMO accounts. Change passwords before any real-world use.")
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()

