"""
Sanjeevni Tech — seed realistic demo appointments across all 50 fictional patients.

Run from backend:
    python .\seed_doctor_appointments.py
    python .\seed_doctor_appointments.py --apply

Behavior:
- Ensures every doctor has at least 4 appointments (does not delete existing appointments).
- Uses all 50 seeded patients across the appointment set, rather than a 3-patient pool.
- Reuses patients across doctors where clinically appropriate, prioritizing the doctor assigned
  to each patient's diagnosis. Additional appointments fill each doctor's minimum.
- Appointment data is fictional test data, not real bookings.
"""
from __future__ import annotations

import argparse
import secrets
from datetime import date, datetime, time, timedelta

from sqlalchemy import inspect

from app.core.database import SessionLocal
from app.models import Appointment, Doctor, Patient, Diagnosis

PATIENT_PREFIX = "PAT-SEED-"
MIN_APPOINTMENTS_PER_DOCTOR = 4

# Explicit mapping mirrors the specialist assignments already created.
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

def enum_value(column, choices):
    enum_values = getattr(column.type, "enums", None)
    if enum_values:
        lowered = {str(v).lower(): v for v in enum_values}
        for choice in choices:
            if choice.lower() in lowered:
                return lowered[choice.lower()]
        for value in enum_values:
            if any(choice.lower() in str(value).lower() for choice in choices):
                return value
        raise RuntimeError(f"No compatible enum value for {column.key}: {enum_values}")
    return choices[0]

def build_payload(columns, doctor, patient, index, today, reason):
    number = f"APT-DEMO-{doctor.id:03d}-{index:02d}"
    values = {
        "appointment_number": number,
        "patient_id": patient.id,
        "doctor_id": doctor.id,
        "appointment_date": today + timedelta(days=(index % 14) + 1),
        "appointment_time": time(hour=9 + (index % 7), minute=0),
        "status": "scheduled",
        "priority": "normal",
        "reason": reason,
        "notes": "Fictional demo appointment created for hospital-system testing.",
        "cancellation_reason": None,
        "checked_in_at": None,
        "started_at": None,
        "completed_at": None,
    }
    payload = {}
    for col in columns:
        name = col.key
        if name in values:
            value = values[name]
            if name == "status":
                value = enum_value(col, ["scheduled", "confirmed", "pending"])
            elif name == "priority":
                value = enum_value(col, ["normal", "medium", "low", "high"])
            payload[name] = value
        elif col.primary_key or col.default is not None or col.server_default is not None or col.nullable:
            continue
        else:
            raise RuntimeError(
                f"Unknown required Appointment field {name!r}; no changes committed. "
                "Add a suitable explicit value before applying."
            )
    return payload

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--apply", action="store_true")
    args = parser.parse_args()

    db = SessionLocal()
    try:
        columns = list(inspect(Appointment).columns)
        doctors = db.query(Doctor).order_by(Doctor.id).all()
        patient_diagnoses = (
            db.query(Patient, Diagnosis)
            .join(Diagnosis, Diagnosis.patient_id == Patient.id)
            .filter(Patient.patient_number.like(f"{PATIENT_PREFIX}%"))
            .order_by(Patient.patient_number)
            .all()
        )
        if not doctors:
            raise RuntimeError("No doctor profiles found.")
        if len(patient_diagnoses) != 50:
            raise RuntimeError(f"Expected 50 seeded patient-diagnosis rows; found {len(patient_diagnoses)}.")

        doctor_by_id = {d.id: d for d in doctors}
        doctor_by_specialty = {d.specialization: d for d in doctors}
        patient_by_id = {p.id: p for p, _ in patient_diagnoses}
        diagnosis_by_patient = {p.id: dx for p, dx in patient_diagnoses}

        # Plan starts with diagnosis-matched patient -> assigned specialist appointments.
        planned_pairs = []
        existing_pairs = {
            (a.doctor_id, a.patient_id)
            for a in db.query(Appointment.doctor_id, Appointment.patient_id).all()
        }
        counts = {
            d.id: db.query(Appointment).filter(Appointment.doctor_id == d.id).count()
            for d in doctors
        }
        used_numbers = {
            n for (n,) in db.query(Appointment.appointment_number).all() if n
        }

        def add_pair(doctor, patient, reason):
            if (doctor.id, patient.id) in existing_pairs:
                return False
            idx = counts[doctor.id] + sum(1 for did, _, _ in planned_pairs if did == doctor.id) + 1
            number = f"APT-DEMO-{doctor.id:03d}-{idx:02d}"
            while number in used_numbers:
                number = f"APT-DEMO-{doctor.id:03d}-{idx:02d}-{secrets.randbelow(900)+100}"
            used_numbers.add(number)
            payload = build_payload(columns, doctor, patient, idx, date.today(), reason)
            payload["appointment_number"] = number
            planned_pairs.append((doctor.id, patient, payload))
            existing_pairs.add((doctor.id, patient.id))
            return True

        # First, assign each seeded patient to their diagnosis-linked doctor.
        for patient, diagnosis in patient_diagnoses:
            specialty = PROBLEM_TO_SPECIALTY.get(diagnosis.diagnosis_name)
            doctor = doctor_by_specialty.get(specialty) if specialty else None
            if doctor is None:
                # The original general doctor is a safe fallback for unmapped cases.
                doctor = next((d for d in doctors if d.specialization == "General Medicine"), doctors[0])
            add_pair(doctor, patient, diagnosis.diagnosis_name)

        # Ensure every doctor has at least four total appointments.
        # Fill gaps with patients whose diagnosis is clinically adjacent to that doctor's specialty,
        # otherwise use a round-robin spread across the full 50-patient set.
        specialty_terms = {
            "Cardiology": ["hypertension", "blood pressure"],
            "Endocrinology": ["diabetes", "vitamin d"],
            "Pulmonology": ["respiratory", "upper respiratory"],
            "Hematology": ["anaemia", "anemia"],
            "Neurology": ["migraine"],
            "Gastroenterology": ["gastro", "reflux"],
            "Allergy and Immunology": ["allergic", "rhinitis"],
            "Orthopaedics": ["back pain", "mechanical"],
            "General Medicine": [],
        }
        for doctor in doctors:
            projected = counts[doctor.id] + sum(1 for did, _, _ in planned_pairs if did == doctor.id)
            while projected < MIN_APPOINTMENTS_PER_DOCTOR:
                terms = specialty_terms.get(doctor.specialization, [])
                candidates = [
                    (p, diagnosis_by_patient[p.id]) for p, _ in patient_diagnoses
                    if (doctor.id, p.id) not in existing_pairs
                    and (not terms or any(term in diagnosis_by_patient[p.id].diagnosis_name.lower() for term in terms))
                ]
                if not candidates:
                    candidates = [
                        (p, diagnosis_by_patient[p.id]) for p, _ in patient_diagnoses
                        if (doctor.id, p.id) not in existing_pairs
                    ]
                if not candidates:
                    raise RuntimeError(f"Could not find another patient for doctor ID {doctor.id}.")
                # Pick the patient with the fewest already planned appointments to spread load.
                patient, diagnosis = min(
                    candidates,
                    key=lambda pair: sum(1 for _, pp, _ in planned_pairs if pp.id == pair[0].id),
                )
                add_pair(doctor, patient, diagnosis.diagnosis_name)
                projected += 1

        # Plan may include all doctors and all 50 patients; show a transparent dry run.
        distinct_patient_ids = {p.id for _, p, _ in planned_pairs}
        print(f"Doctors: {len(doctors)}")
        print(f"Seed patients: {len(patient_diagnoses)}")
        print(f"New appointments planned: {len(planned_pairs)}")
        print(f"Distinct patients included in new appointments: {len(distinct_patient_ids)} / 50")
        print("Projected appointments per doctor:")
        for doctor in doctors:
            projected = counts[doctor.id] + sum(1 for did, _, _ in planned_pairs if did == doctor.id)
            print(f"  Doctor ID {doctor.id} ({doctor.specialization}): {projected}")
        if not args.apply:
            db.rollback()
            print("DRY RUN ONLY — no database changes committed.")
            print("If counts look correct, run: python .\\seed_doctor_appointments.py --apply")
            return

        for doctor_id, patient, payload in planned_pairs:
            db.add(Appointment(**payload))
        db.commit()
        print("SUCCESS: demo appointments committed. Existing appointments were preserved.")
        print("All new appointments use fictional seeded patients and are marked scheduled.")
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    main()
