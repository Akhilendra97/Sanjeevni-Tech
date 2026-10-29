"""
Safe synthetic patient seeder for Sanjeevni Tech.
Dry-run: python seed_patients.py
Apply:   python seed_patients.py --apply
"""
import argparse
import csv
import secrets
import string
from datetime import date, timedelta
from pathlib import Path

from sqlalchemy import MetaData, Table, select

from app.core.database import SessionLocal, engine
from app.core.security import hash_password
from app.core.constants import Gender
from app.models.patient import Patient
from app.models.user import User

TARGET_COUNT = 50
PREFIX = "seedpatient"
EMAIL_DOMAIN = "example.test"
PHONE_PREFIX = "9000008"


def make_password():
    alphabet = string.ascii_letters + string.digits + "!@#$%&*"
    while True:
        value = "".join(secrets.choice(alphabet) for _ in range(18))
        if (any(c.islower() for c in value)
                and any(c.isupper() for c in value)
                and any(c.isdigit() for c in value)
                and any(c in "!@#$%&*" for c in value)):
            return value


def get_patient_role_id():
    metadata = MetaData()
    roles = Table("roles", metadata, autoload_with=engine)
    pk = list(roles.primary_key.columns)
    if not pk:
        raise RuntimeError("roles table has no primary key")
    with engine.connect() as conn:
        for row in conn.execute(select(roles)).mappings():
            values = [str(v).strip().lower() for v in row.values()
                      if v is not None]
            if "patient" in values:
                return int(row[pk[0].name])
    raise RuntimeError("Patient role not found; no changes made")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--apply", action="store_true")
    args = parser.parse_args()

    role_id = get_patient_role_id()
    db = SessionLocal()
    try:
        usernames = set(db.scalars(select(User.username)).all())
        emails = {x.lower() for x in db.scalars(select(User.email)).all()}
        phones = {x for x in db.scalars(select(User.phone)).all() if x}
        numbers = set(db.scalars(select(Patient.patient_number)).all())

        genders = [g.value for g in Gender]
        if len(genders) < 2:
            raise RuntimeError("Gender enum needs at least two values")

        first_names = [
            "Aarav", "Vivaan", "Aditya", "Vihaan", "Arjun", "Reyansh",
            "Ishaan", "Aanya", "Diya", "Ananya", "Saanvi", "Myra",
            "Kavya", "Rohan", "Ira", "Kabir", "Meera", "Dev", "Nisha"
        ]
        last_names = [
            "Sharma", "Verma", "Gupta", "Singh", "Yadav", "Mishra",
            "Khan", "Patel", "Jain", "Agarwal", "Das", "Rao", "Joshi",
            "Saxena", "Tiwari", "Chauhan", "Kapoor", "Pandey", "Sinha"
        ]

        records = []
        i = 1
        while len(records) < TARGET_COUNT:
            username = f"{PREFIX}_{i:03d}"
            email = f"{username}@{EMAIL_DOMAIN}"
            phone = f"{PHONE_PREFIX}{i:03d}"
            patient_number = f"STP-{i:05d}"
            i += 1

            if (username in usernames or email.lower() in emails
                    or phone in phones or patient_number in numbers):
                continue

            first = first_names[i % len(first_names)]
            last = last_names[i % len(last_names)]
            records.append({
                "username": username,
                "email": email,
                "phone": phone,
                "patient_number": patient_number,
                "first": first,
                "last": last,
                "password": make_password(),
                "gender": genders[i % len(genders)],
                "dob": date(1960, 1, 1) + timedelta(days=(i * 173) % 18000),
            })
            usernames.add(username)
            emails.add(email.lower())
            phones.add(phone)
            numbers.add(patient_number)

        print("Mode:", "APPLY" if args.apply else "DRY-RUN")
        print("Patient role ID:", role_id)
        print("New patient account/profile pairs:", len(records))
        for item in records[:5]:
            print(item["patient_number"], "|", item["username"])
        print("Existing records will not be deleted or updated.")

        if not args.apply:
            print("Dry-run only; database unchanged.")
            return

        credentials = []
        for item in records:
            user = User(
                username=item["username"],
                email=item["email"],
                password_hash=hash_password(item["password"]),
                full_name=f'{item["first"]} {item["last"]}',
                phone=item["phone"],
                role_id=role_id,
                status="active",
                is_verified=False,
                is_superuser=False,
            )
            db.add(user)
            db.flush()

            patient = Patient(
                user_id=user.id,
                patient_number=item["patient_number"],
                first_name=item["first"],
                last_name=item["last"],
                date_of_birth=item["dob"],
                gender=item["gender"],
                phone=item["phone"],
                email=item["email"],
                address="Synthetic demo address",
                city="Kanpur",
                state="Uttar Pradesh",
                postal_code="208001",
                country="India",
                nationality="Indian",
                is_active=True,
            )
            db.add(patient)
            credentials.append({
                "username": item["username"],
                "email": item["email"],
                "password": item["password"],
                "patient_number": item["patient_number"],
            })

        db.commit()

        out_dir = Path("backups")
        out_dir.mkdir(exist_ok=True)
        output = out_dir / "seed_patient_credentials.csv"
        with output.open("w", newline="", encoding="utf-8") as f:
            writer = csv.DictWriter(f, fieldnames=credentials[0].keys())
            writer.writeheader()
            writer.writerows(credentials)

        print("SUCCESS: 50 synthetic patient accounts/profiles inserted.")
        print("Credentials file:", output.resolve())
        print("Keep credentials private; these are demo accounts.")
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
