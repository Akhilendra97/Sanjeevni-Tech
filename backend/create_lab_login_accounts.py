"""Create one distinct LABORATORY-role login for each active Lab facility.

Local development/demo helper. Creates accounts only when username/email do not exist.
New plaintext credentials are written to laboratory_login_credentials.csv and printed.
Protect/delete the CSV after securely recording the credentials.
"""
from __future__ import annotations

import csv
import re
import secrets
import string
from pathlib import Path

from sqlalchemy import select

from app.core.database import SessionLocal
from app.core.security import hash_password
from app.models.lab import Lab
from app.models.role import Role
from app.models.user import User

ROLE_NAME = "laboratory"
EMAIL_DOMAIN = "example.com"
OUTPUT_FILE = Path(__file__).resolve().parent / "laboratory_login_credentials.csv"


def slug(value: str) -> str:
    result = re.sub(r"[^a-z0-9]+", "-", (value or "lab").lower()).strip("-")
    return result[:42] or "lab"


def make_password(length: int = 20) -> str:
    # URL-safe characters avoid login/form encoding surprises.
    alphabet = string.ascii_letters + string.digits + "-_"
    while True:
        value = "".join(secrets.choice(alphabet) for _ in range(length))
        if (any(c.islower() for c in value) and any(c.isupper() for c in value)
                and any(c.isdigit() for c in value)):
            return value


def main() -> None:
    db = SessionLocal()
    created: list[dict[str, str]] = []
    skipped = 0
    try:
        labs = db.scalars(select(Lab).where(Lab.is_active.is_(True)).order_by(Lab.id)).all()
        if not labs:
            raise RuntimeError("No active labs found. Run the laboratory catalogue seeder first.")

        role = db.scalar(select(Role).where(Role.name.ilike(ROLE_NAME)))
        if role is None:
            role = Role(name=ROLE_NAME, description="Laboratory staff access role")
            db.add(role)
            db.flush()

        for lab in labs:
            code_slug = slug(lab.code or lab.name).replace("-", "_")[:48]
            username = f"lab_{code_slug}"
            email_slug = slug(lab.code or lab.name).replace("-", ".")[:48]
            email = f"{email_slug}@{EMAIL_DOMAIN}"

            existing = db.scalar(select(User).where(
                (User.username == username) | (User.email == email)
            ))
            if existing is not None:
                skipped += 1
                continue

            password = make_password()
            user = User(
                username=username,
                email=email,
                password_hash=hash_password(password),
                full_name=f"{lab.name} Laboratory Staff"[:150],
                phone=None,
                role_id=role.id,
                status="active",
                is_verified=True,
                is_superuser=False,
            )
            db.add(user)
            created.append({
                "laboratory": lab.name,
                "lab_code": lab.code,
                "username": username,
                "email": email,
                "temporary_password": password,
                "role": ROLE_NAME,
                "note": "DEMO/LOCAL account; change password after first login if supported",
            })

        db.commit()
        if created:
            with OUTPUT_FILE.open("w", newline="", encoding="utf-8") as file:
                writer = csv.DictWriter(file, fieldnames=list(created[0].keys()))
                writer.writeheader()
                writer.writerows(created)

        print("LAB LOGIN ACCOUNT SEED COMPLETE")
        print(f"Active laboratories found: {len(labs)}")
        print(f"New accounts created: {len(created)}")
        print(f"Existing accounts preserved/skipped: {skipped}")
        if created:
            print(f"Credentials CSV: {OUTPUT_FILE}")
            print("\nNEW ACCOUNT CREDENTIALS (save securely; plaintext shown only this run):")
            for item in created:
                print(f"{item['laboratory']} | username={item['username']} | email={item['email']} | password={item['temporary_password']}")
        else:
            print("No new passwords generated. Existing account passwords were not changed or recovered.")
        print("IMPORTANT: These are laboratory-role accounts. The current User schema has no lab_id link,")
        print("so facility-level data isolation is NOT established by this script alone.")
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
