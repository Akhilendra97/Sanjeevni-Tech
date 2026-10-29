"""
Sanjeevni Tech: add fictional demo specialist doctors and assign seed patients.
Run from backend folder:
    python .\seed_specialist_doctors.py          # dry run
    python .\seed_specialist_doctors.py --apply  # apply changes

Only creates missing departments and new demo doctor accounts. It preserves the existing
doctor account, patient accounts, and all unrelated users/clinical records.
All names and credentials generated here are fictional test data.
"""
from __future__ import annotations

import argparse
import csv
import secrets
import string
from datetime import date
from pathlib import Path

from sqlalchemy import inspect
from app.core.database import SessionLocal
from app.core.security import hash_password
from app.models import Department, Diagnosis, Doctor, Patient, User

ROLE_DOCTOR_ID = 2
SEED_PATIENT_PREFIX = "PAT-SEED-"
DEMO_USERNAME_PREFIX = "demodoc_"
CREDENTIALS_PATH = Path("backups") / "demo_doctor_credentials.csv"

# Department name, code, description, specialization, qualification, experience, fee, initials
DOCTOR_SPECS = [
    ("Cardiology", "CARD", "Heart and blood pressure care", "Cardiology", "MD Medicine, DM Cardiology", 12, 800, "CARD"),
    ("Endocrinology", "ENDO", "Diabetes and hormonal disorders", "Endocrinology", "MD Medicine, DM Endocrinology", 10, 750, "ENDO"),
    ("Pulmonology", "PULM", "Respiratory and lung conditions", "Pulmonology", "MD Respiratory Medicine", 9, 650, "PULM"),
    ("Hematology", "HEMA", "Blood disorders and anaemia", "Hematology", "MD Pathology, Fellowship in Hematology", 11, 700, "HEMA"),
    ("Neurology", "NEUR", "Headache and neurological conditions", "Neurology", "MD Medicine, DM Neurology", 13, 900, "NEUR"),
    ("Gastroenterology", "GAST", "Digestive system conditions", "Gastroenterology", "MD Medicine, DM Gastroenterology", 12, 850, "GAST"),
    ("Allergy & Immunology", "ALLG", "Allergies and immune conditions", "Allergy and Immunology", "MD Medicine, Fellowship in Allergy and Immunology", 8, 650, "ALLG"),
    ("Orthopaedics", "ORTH", "Musculoskeletal and back pain care", "Orthopaedics", "MS Orthopaedics", 14, 800, "ORTH"),
    ("Dermatology", "DERM", "Skin and hair conditions", "Dermatology", "MD Dermatology", 10, 700, "DERM"),
    ("Paediatrics", "PAED", "Child health", "Paediatrics", "MD Paediatrics", 9, 600, "PAED"),
    ("Obstetrics & Gynaecology", "OBGY", "Women's reproductive health", "Obstetrics and Gynaecology", "MS Obstetrics and Gynaecology", 12, 750, "OBGY"),
    ("Nephrology", "NEPH", "Kidney conditions", "Nephrology", "MD Medicine, DM Nephrology", 11, 850, "NEPH"),
    ("Psychiatry", "PSYC", "Mental health care", "Psychiatry", "MD Psychiatry", 8, 650, "PSYC"),
    ("Oncology", "ONCO", "Cancer diagnosis and care", "Medical Oncology", "MD Medicine, DM Medical Oncology", 10, 1000, "ONCO"),
]

# Problem -> specialty. Keep this explicit so assignments are reproducible.
PROBLEM_TO_SPECIALTY = {
    "Essential hypertension": "Cardiology",
    "Type 2 diabetes mellitus": "Endocrinology",
    "Acute upper respiratory infection": "Pulmonology",
    "Iron deficiency anaemia": "Hematology",
    "Migraine": "Neurology",
    "Gastro-oesophageal reflux": "Gastroenterology",
    "Seasonal allergic rhinitis": "Allergy and Immunology",
    "Vitamin D deficiency": "Endocrinology",
    "Acute gastroenteritis": "Gastroenterology",
    "Mechanical low back pain": "Orthopaedics",
}

FIRST_NAMES = [
    "Dr. Aditi", "Dr. Rohan", "Dr. Meera", "Dr. Arjun", "Dr. Kavita",
    "Dr. Vivek", "Dr. Nisha", "Dr. Karan", "Dr. Pooja", "Dr. Aman",
    "Dr. Sneha", "Dr. Rahul", "Dr. Ishita", "Dr. Varun",
]
LAST_NAMES = [
    "Sharma", "Verma", "Singh", "Gupta", "Mishra", "Pandey", "Srivastava",
    "Tiwari", "Shukla", "Jaiswal", "Tripathi", "Awasthi", "Saxena", "Yadav",
]

def password(length: int = 16) -> str:
    alphabet = string.ascii_letters + string.digits + "!@#$%*-_"
    while True:
        value = "".join(secrets.choice(alphabet) for _ in range(length))
        if (any(c.islower() for c in value) and any(c.isupper() for c in value)
                and any(c.isdigit() for c in value) and any(c in "!@#$%*-_" for c in value)):
            return value

def field_names(model):
    return {c.key for c in inspect(model).columns}

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--apply", action="store_true", help="Commit database changes")
    args = parser.parse_args()

    db = SessionLocal()
    created_credentials = []
    try:
        required_user_fields = {"username", "email", "password_hash", "full_name", "phone", "role_id"}
        if not required_user_fields.issubset(field_names(User)):
            raise RuntimeError("User model fields do not match the expected schema.")
        if not {"user_id", "department_id", "employee_id", "registration_number",
                "specialization", "qualification", "experience_years",
                "consultation_fee", "joining_date", "bio", "is_available"}.issubset(field_names(Doctor)):
            raise RuntimeError("Doctor model fields do not match the expected schema.")

        existing_doctor_user = db.query(User).filter(User.role_id == ROLE_DOCTOR_ID).first()
        if existing_doctor_user is None:
            raise RuntimeError("Doctor role/account not found; refusing to create accounts without a valid doctor role.")

        patients = (
            db.query(Patient, Diagnosis)
            .join(Diagnosis, Diagnosis.patient_id == Patient.id)
            .filter(Patient.patient_number.like(f"{SEED_PATIENT_PREFIX}%"))
            .order_by(Patient.patient_number)
            .all()
        )
        if len(patients) != 50:
            raise RuntimeError(f"Expected 50 seeded patients with one joined diagnosis each; found {len(patients)}. No changes made.")

        # Require each seeded patient to have exactly one diagnosis to avoid ambiguous assignment.
        patient_ids = [p.id for p, _ in patients]
        if len(set(patient_ids)) != 50:
            raise RuntimeError("Some seeded patients have multiple diagnoses; refusing ambiguous assignment.")

        # Reuse existing departments by name, otherwise create them.
        departments = {d.name: d for d in db.query(Department).all()}
        spec_to_doctor = {}

        # Include General Medicine as an extra catch-all specialist, plus the 14 extra specialties.
        specs = [("General Medicine", "GENM", "Primary and general adult medical care",
                  "General Medicine", "MD General Medicine", 10, 500, "GENM")] + DOCTOR_SPECS

        # The first specialist is an additional demo doctor for General Medicine; existing real/demo account is preserved.
        occupied_usernames = {u.username for u in db.query(User.username).all()}
        occupied_emails = {u.email for u in db.query(User.email).all()}
        occupied_employee_ids = {d.employee_id for d in db.query(Doctor.employee_id).all() if d.employee_id}
        occupied_reg_numbers = {d.registration_number for d in db.query(Doctor.registration_number).all() if d.registration_number}

        base_names = []
        for i in range(len(specs)):
            first = FIRST_NAMES[i % len(FIRST_NAMES)].replace("Dr. ", "")
            last = LAST_NAMES[i % len(LAST_NAMES)]
            base_names.append((first, last))

        for idx, spec in enumerate(specs, start=1):
            dept_name, dept_code, dept_desc, specialization, qualification, experience, fee, initials = spec
            department = departments.get(dept_name)
            if department is None:
                department = Department(
                    name=dept_name,
                    code=dept_code,
                    description=dept_desc,
                    location="Sanjeevni Tech Hospital",
                    contact_number=f"+91-90000-{idx:05d}",
                    is_active=True,
                )
                db.add(department)
                db.flush()
                departments[dept_name] = department

            username = f"{DEMO_USERNAME_PREFIX}{initials.lower()}_{idx:02d}"
            while username in occupied_usernames:
                username = f"{DEMO_USERNAME_PREFIX}{initials.lower()}_{idx:02d}_{secrets.randbelow(900)+100}"
            email = f"{username}@example.test"
            while email in occupied_emails:
                email = f"{DEMO_USERNAME_PREFIX}{initials.lower()}_{idx:02d}_{secrets.randbelow(900)+100}@example.test"
            employee_id = f"DEMO-DOC-{idx:03d}"
            while employee_id in occupied_employee_ids:
                employee_id += "X"
            registration_number = f"DEMO-REG-{idx:04d}"
            while registration_number in occupied_reg_numbers:
                registration_number += "X"

            first, last = base_names[idx - 1]
            full_name = f"{first} {last}"
            plain_password = password()
            user_kwargs = dict(
                username=username,
                email=email,
                password_hash=hash_password(plain_password),
                full_name=full_name,
                phone=f"+91-90000-{idx:05d}",
                role_id=ROLE_DOCTOR_ID,
            )
            # Set optional/common account fields only when present on this model.
            uf = field_names(User)
            if "status" in uf:
                user_kwargs["status"] = getattr(existing_doctor_user, "status", "active")
            if "is_verified" in uf:
                user_kwargs["is_verified"] = True
            if "is_superuser" in uf:
                user_kwargs["is_superuser"] = False
            new_user = User(**user_kwargs)
            db.add(new_user)
            db.flush()

            doctor_kwargs = dict(
                user_id=new_user.id,
                department_id=department.id,
                employee_id=employee_id,
                registration_number=registration_number,
                specialization=specialization,
                qualification=qualification,
                experience_years=experience,
                consultation_fee=fee,
                joining_date=date(2022, 1, 1),
                bio=f"Fictional demo profile for {specialization}. Qualification and experience are illustrative test data, not a real clinician's verified credentials.",
                is_available=True,
            )
            new_doctor = Doctor(**doctor_kwargs)
            db.add(new_doctor)
            db.flush()
            spec_to_doctor[specialization] = new_doctor
            created_credentials.append({
                "doctor_id": new_doctor.id,
                "full_name": full_name,
                "specialization": specialization,
                "department": dept_name,
                "username": username,
                "email": email,
                "password": plain_password,
                "phone": user_kwargs["phone"],
                "employee_id": employee_id,
                "registration_number": registration_number,
                "profile_type": "FICTIONAL DEMO DATA — NOT A REAL DOCTOR",
            })
            occupied_usernames.add(username)
            occupied_emails.add(email)
            occupied_employee_ids.add(employee_id)
            occupied_reg_numbers.add(registration_number)

        assigned = 0
        missing = []
        for patient, diagnosis in patients:
            specialty = PROBLEM_TO_SPECIALTY.get(diagnosis.diagnosis_name)
            doctor = spec_to_doctor.get(specialty) if specialty else None
            if doctor is None:
                missing.append((patient.patient_number, diagnosis.diagnosis_name, specialty))
                continue
            diagnosis.doctor_id = doctor.id
            assigned += 1

        if missing:
            raise RuntimeError(f"Could not map all diagnoses: {missing}. Transaction will be rolled back.")

        if not args.apply:
            db.rollback()
            print("DRY RUN ONLY — no database changes committed.")
            print(f"Would create {len(created_credentials)} fictional demo doctor accounts and required departments.")
            print(f"Would assign {assigned} seeded patient diagnoses to matching specialists.")
            print("To apply, run: python .\\seed_specialist_doctors.py --apply")
            return

        db.commit()
        CREDENTIALS_PATH.parent.mkdir(parents=True, exist_ok=True)
        with CREDENTIALS_PATH.open("w", newline="", encoding="utf-8-sig") as f:
            writer = csv.DictWriter(f, fieldnames=list(created_credentials[0].keys()))
            writer.writeheader()
            writer.writerows(created_credentials)
        print("SUCCESS")
        print(f"Created fictional demo doctors: {len(created_credentials)}")
        print(f"Seed patient diagnoses assigned: {assigned}/50")
        print(f"Credentials CSV: {CREDENTIALS_PATH.resolve()}")
        print("Existing doctor account, patients, and unrelated user accounts were preserved.")
        print("Demo registration numbers and qualifications are fictional test data, not valid credentials.")
        print("Do not commit or share the credentials CSV.")
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    main()
