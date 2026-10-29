from __future__ import annotations

import sys
from datetime import date
from pathlib import Path

# Run from backend or from any working directory.
BACKEND = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND))

import app.models  # noqa: F401
from sqlalchemy import select, func
from app.core.database import SessionLocal
from app.models.ward import Ward
from app.models.bed import Bed
from app.models.patient import Patient
from app.models.doctor import Doctor
from app.models.admission import Admission

WARD_DEFINITIONS = [
    ("General Male Ward", "GEN-M", "General", "Ground Floor", "Block A", 20, "Shared general-care ward for adult male patients."),
    ("General Female Ward", "GEN-F", "General", "Ground Floor", "Block A", 20, "Shared general-care ward for adult female patients."),
    ("General Ward 2", "GEN-2", "General", "First Floor", "Block A", 16, "Additional general inpatient capacity."),
    ("Private Rooms", "PRIV", "Private", "First Floor", "Block B", 12, "Single-patient rooms."),
    ("Semi Private Ward", "SEMI", "Semi-Private", "First Floor", "Block B", 16, "Twin-sharing rooms."),
    ("Intensive Care Unit", "ICU", "ICU", "Second Floor", "Critical Care Block", 10, "Critical care beds with continuous monitoring."),
    ("High Dependency Unit", "HDU", "HDU", "Second Floor", "Critical Care Block", 8, "High-dependency monitoring and treatment."),
    ("Emergency Observation", "ER-OBS", "Emergency", "Ground Floor", "Emergency Block", 10, "Short-stay observation beds."),
    ("Pediatric Ward", "PED", "Pediatric", "First Floor", "Block C", 12, "Inpatient care for children."),
    ("Maternity Ward", "MAT", "Maternity", "Second Floor", "Block C", 12, "Maternal inpatient care."),
    ("Post Operative Recovery", "POST-OP", "Recovery", "Second Floor", "Surgical Block", 8, "Post-operative recovery and observation."),
    ("Isolation Ward", "ISO", "Isolation", "Ground Floor", "Block D", 8, "Designated isolation capacity; follow hospital infection-control policy."),
    ("Orthopedic Ward", "ORTHO", "Orthopedic", "Third Floor", "Block D", 12, "Orthopedic and post-fracture inpatient care."),
    ("Cardiac Care Ward", "CARD", "Cardiac", "Third Floor", "Block E", 8, "Cardiac inpatient care."),
    ("NICU", "NICU", "Neonatal ICU", "Second Floor", "Maternity Block", 8, "Neonatal intensive care; only appropriately equipped beds should be used clinically."),
]

def main():
    created_wards = created_beds = 0
    occupied_assignments = 0
    with SessionLocal() as db:
        wards = {}
        for name, code, ward_type, floor, location, capacity, description in WARD_DEFINITIONS:
            ward = db.scalar(select(Ward).where(Ward.code == code))
            if ward is None:
                ward = db.scalar(select(Ward).where(Ward.name == name))
            if ward is None:
                ward = Ward(name=name, code=code, ward_type=ward_type, floor=floor,
                            location=location, description=description, capacity=capacity, is_active=True)
                db.add(ward)
                db.flush()
                created_wards += 1
            else:
                # Keep existing capacity and metadata; only reactivate the known demo ward.
                if not ward.is_active:
                    ward.is_active = True
            wards[code] = ward
        db.flush()

        for _, code, ward_type, _, _, capacity, _ in WARD_DEFINITIONS:
            ward = wards[code]
            prefix = code.replace("-", "")
            bed_type = ward_type
            for number in range(1, capacity + 1):
                bed_number = f"{prefix}-{number:03d}"
                bed = db.scalar(select(Bed).where(Bed.ward_id == ward.id, Bed.bed_number == bed_number))
                if bed is None:
                    db.add(Bed(ward_id=ward.id, bed_number=bed_number, bed_type=bed_type,
                               status="available", is_active=True,
                               notes="Seeded demo inventory; verify equipment and readiness before clinical use."))
                    created_beds += 1
        db.commit()

        # Occupy beds only by creating real Admission rows linked to existing patients and doctors.
        # Never mark a bed occupied without an admission record.
        already_seeded = db.scalar(select(func.count(Admission.id)).where(Admission.admission_number.like("DEMO-WARD-%"))) or 0
        if already_seeded == 0:
            patients = list(db.scalars(select(Patient).order_by(Patient.id)).all())
            doctors = list(db.scalars(select(Doctor).order_by(Doctor.id)).all())
            if patients and doctors:
                active_patient_ids = set(db.scalars(
                    select(Admission.patient_id).where(
                        Admission.status.notin_(["discharged", "cancelled", "completed"])
                    )
                ).all())
                available_beds = list(db.scalars(
                    select(Bed).where(Bed.is_active.is_(True), Bed.status == "available").order_by(Bed.id)
                ).all())
                eligible_patients = [p for p in patients if p.id not in active_patient_ids]
                # Fill up to 30% of newly available beds, capped at 30 demo admissions.
                target = min(30, len(available_beds) // 3, len(eligible_patients))
                for idx in range(target):
                    bed = available_beds[idx]
                    patient = eligible_patients[idx]
                    doctor = doctors[idx % len(doctors)]
                    admission = Admission(
                        admission_number=f"DEMO-WARD-{date.today():%Y%m%d}-{idx+1:03d}",
                        patient_id=patient.id,
                        doctor_id=doctor.id,
                        ward_id=bed.ward_id,
                        bed_id=bed.id,
                        admission_date=date.today(),
                        status="admitted",
                        reason="Demo inpatient admission; verify clinical record before operational use.",
                        diagnosis="Demo record - clinical diagnosis requires clinician verification.",
                        notes="Seeded demo admission linked to occupied bed.",
                    )
                    db.add(admission)
                    bed.status = "occupied"
                    occupied_assignments += 1
                db.commit()

        total_wards = db.scalar(select(func.count(Ward.id))) or 0
        total_beds = db.scalar(select(func.count(Bed.id))) or 0
        occupied = db.scalar(select(func.count(Bed.id)).where(Bed.status == "occupied", Bed.is_active.is_(True))) or 0
        available = db.scalar(select(func.count(Bed.id)).where(Bed.status == "available", Bed.is_active.is_(True))) or 0
        demo_admissions = db.scalar(select(func.count(Admission.id)).where(Admission.admission_number.like("DEMO-WARD-%"))) or 0
        print("WARD/BED SEED COMPLETE")
        print(f"Wards created this run: {created_wards}")
        print(f"Beds created this run: {created_beds}")
        print(f"Total wards in database: {total_wards}")
        print(f"Total beds in database: {total_beds}")
        print(f"Occupied beds (status): {occupied}")
        print(f"Available beds (status): {available}")
        print(f"Demo admissions created this run: {occupied_assignments}")
        print(f"Demo admissions total: {demo_admissions}")
        if demo_admissions == 0:
            print("NOTE: No eligible existing patient/doctor pairs were available, so no fake occupied beds were created.")
        print("This is demo inventory. Validate clinical suitability and staffing before real-world use.")

if __name__ == "__main__":
    main()
