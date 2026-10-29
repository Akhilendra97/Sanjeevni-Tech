"""Idempotently seed clearly labeled DEMO analytics records for local demonstration only.
Does not delete or update existing clinical/business records.
"""
from __future__ import annotations
from datetime import datetime, timedelta, timezone
from sqlalchemy import func, select
from app.core.database import SessionLocal
from app.models.patient import Patient
from app.models.doctor import Doctor
from app.models.department import Department
from app.models.emergency import Emergency
from app.models.triage import Triage
from app.models.operation_theatre import OperationTheatre
from app.models.surgery import Surgery
from app.models.staff import Staff

PREFIX = "DEMO-ANALYTICS-"
EMERGENCY_TARGET = 10
SURGERY_TARGET = 10

COMPLAINTS = [
    ("Chest discomfort", "DEMO ONLY: simulated chest discomfort presentation", "urgent", 75),
    ("Minor fall", "DEMO ONLY: simulated fall with minor injury", "routine", 25),
    ("Breathing difficulty", "DEMO ONLY: simulated breathing difficulty", "emergency", 90),
    ("Abdominal pain", "DEMO ONLY: simulated abdominal pain", "urgent", 60),
    ("Fever assessment", "DEMO ONLY: simulated fever assessment", "routine", 20),
    ("Road incident", "DEMO ONLY: simulated road incident assessment", "emergency", 95),
    ("Headache", "DEMO ONLY: simulated headache presentation", "routine", 15),
    ("Dehydration symptoms", "DEMO ONLY: simulated dehydration presentation", "urgent", 55),
    ("Laceration assessment", "DEMO ONLY: simulated laceration assessment", "urgent", 50),
    ("General weakness", "DEMO ONLY: simulated weakness presentation", "routine", 20),
]
PROCEDURES = [
    ("DEMO laparoscopic procedure", "elective", "scheduled"),
    ("DEMO fracture fixation", "elective", "completed"),
    ("DEMO appendectomy", "emergency", "completed"),
    ("DEMO hernia repair", "elective", "scheduled"),
    ("DEMO wound debridement", "emergency", "completed"),
    ("DEMO gallbladder procedure", "elective", "scheduled"),
    ("DEMO soft-tissue procedure", "elective", "cancelled"),
    ("DEMO orthopaedic procedure", "elective", "completed"),
    ("DEMO endoscopic procedure", "elective", "scheduled"),
    ("DEMO minor surgical procedure", "elective", "completed"),
]

def count(db, model):
    return int(db.scalar(select(func.count()).select_from(model)) or 0)

def main():
    db = SessionLocal()
    report = []
    try:
        patients = list(db.scalars(select(Patient).order_by(Patient.id)).all())
        doctors = list(db.scalars(select(Doctor).order_by(Doctor.id)).all())
        departments = list(db.scalars(select(Department).order_by(Department.id)).all())
        if not patients or not doctors or not departments:
            raise RuntimeError("Seed prerequisites missing: need at least one patient, doctor, and department. No changes committed.")

        # Add DEMO-only emergency records until there are 10 in this demo namespace.
        existing_emergencies = list(db.scalars(select(Emergency).where(Emergency.emergency_number.like(PREFIX + "ER-%")).order_by(Emergency.id)).all())
        for idx in range(len(existing_emergencies), EMERGENCY_TARGET):
            patient = patients[idx % len(patients)]
            doctor = doctors[idx % len(doctors)]
            complaint, symptoms, level, priority = COMPLAINTS[idx % len(COMPLAINTS)]
            arrived = datetime.now(timezone.utc) - timedelta(days=(idx % 7), hours=(idx % 4))
            er = Emergency(
                emergency_number=f"{PREFIX}ER-{idx+1:03d}", patient_id=patient.id,
                doctor_id=doctor.id, arrival_time=arrived, triage_level=level,
                chief_complaint=complaint, symptoms=symptoms,
                initial_assessment="Synthetic demonstration record; not a real clinical assessment.",
                treatment="Demo-only placeholder; not medical advice or actual treatment.",
                status=["active", "discharged", "under_observation"][idx % 3],
                disposition=[None, "discharged", "observation"][idx % 3],
                notes="DEMO ONLY — synthetic analytics seed; do not use for clinical care.",
            )
            db.add(er)
            db.flush()
            db.add(Triage(
                triage_number=f"{PREFIX}TR-{idx+1:03d}", emergency_id=er.id,
                patient_id=patient.id, assessed_by=None, triage_level=level,
                priority_score=priority, chief_complaint=complaint, symptoms=symptoms,
                assessment="DEMO ONLY — synthetic triage data; not a real assessment.",
                recommended_department=departments[idx % len(departments)].name,
                status="active" if idx % 3 == 0 else "completed",
                assessed_at=arrived, notes="DEMO ONLY — synthetic record.",
            ))
        db.flush()

        existing_surgeries = list(db.scalars(select(Surgery).where(Surgery.surgery_number.like(PREFIX + "SX-%")).order_by(Surgery.id)).all())
        theatres = list(db.scalars(select(OperationTheatre).order_by(OperationTheatre.id)).all())
        staff_rows = list(db.scalars(select(Staff).order_by(Staff.id)).all())
        for idx in range(len(existing_surgeries), SURGERY_TARGET):
            patient = patients[idx % len(patients)]
            doctor = doctors[idx % len(doctors)]
            department = departments[idx % len(departments)]
            start = datetime.now(timezone.utc) - timedelta(days=(idx % 7), hours=2)
            end = start + timedelta(hours=1)
            if idx >= len(theatres):
                ot = OperationTheatre(
                    ot_number=f"{PREFIX}OT-{idx+1:03d}",
                    ot_name=f"Demo Operating Theatre {idx+1:02d}",
                    ot_type="general", department_id=department.id,
                    patient_id=patient.id, surgeon_id=doctor.id,
                    anaesthetist_id=doctors[(idx+1) % len(doctors)].id if len(doctors) > 1 else None,
                    assigned_staff_id=staff_rows[idx % len(staff_rows)].id if staff_rows else None,
                    surgery_type=PROCEDURES[idx % len(PROCEDURES)][1],
                    scheduled_start=start, scheduled_end=end,
                    status="scheduled", notes="DEMO ONLY — synthetic operating theatre row.",
                )
                db.add(ot)
                db.flush()
                theatres.append(ot)
            else:
                ot = theatres[idx]
            procedure, kind, status = PROCEDURES[idx % len(PROCEDURES)]
            actual_start = start if status == "completed" else None
            actual_end = end if status == "completed" else None
            db.add(Surgery(
                surgery_number=f"{PREFIX}SX-{idx+1:03d}",
                patient_id=patient.id, operation_theatre_id=ot.id,
                department_id=department.id, surgeon_id=doctor.id,
                anaesthetist_id=doctors[(idx+1) % len(doctors)].id if len(doctors) > 1 else None,
                procedure_name=procedure, surgery_type=kind,
                scheduled_start=start, scheduled_end=end,
                actual_start=actual_start, actual_end=actual_end,
                preoperative_diagnosis="DEMO ONLY — synthetic placeholder.",
                procedure_details="Synthetic demo record for dashboard testing only.",
                anaesthesia_type="Demo placeholder", status=status,
                notes="DEMO ONLY — not a real operation or clinical record.",
            ))
        db.commit()
        report = [
            "Sanjeevni Analytics Demo Seed — RESULTS",
            "IMPORTANT: records below are synthetic DEMO ONLY, not real clinical events.",
            f"Emergency records total: {count(db, Emergency)}",
            f"DEMO emergency records: {db.scalar(select(func.count()).select_from(Emergency).where(Emergency.emergency_number.like(PREFIX + 'ER-%')))}",
            f"Triage records total: {count(db, Triage)}",
            f"DEMO triage records: {db.scalar(select(func.count()).select_from(Triage).where(Triage.triage_number.like(PREFIX + 'TR-%')))}",
            f"Surgery records total: {count(db, Surgery)}",
            f"DEMO surgery records: {db.scalar(select(func.count()).select_from(Surgery).where(Surgery.surgery_number.like(PREFIX + 'SX-%')))}",
            f"Operation theatre records total: {count(db, OperationTheatre)}",
            f"DEMO operation theatres: {db.scalar(select(func.count()).select_from(OperationTheatre).where(OperationTheatre.ot_number.like(PREFIX + 'OT-%')))}",
            f"Patients preserved: {count(db, Patient)}",
            "No existing records were updated or deleted.",
        ]
        print("\n".join(report))
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    main()
