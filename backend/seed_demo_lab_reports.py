"""Create clearly labelled DEMO-only laboratory samples/reports for every active patient.

This script is for local development/demo data only. It deliberately does not generate
real-looking clinical values or diagnoses. It is idempotent and preserves existing records.
Run from backend with the project's virtual environment active:
    python seed_demo_lab_reports.py
"""
from datetime import datetime, timezone
import re

from sqlalchemy import select
from app.core.database import SessionLocal
from app.models.patient import Patient
from app.models.lab import Lab
from app.models.lab_test import LabTest
from app.models.lab_sample import LabSample
from app.models.lab_report import LabReport

# Keywords select a relevant test category only; they do NOT determine a diagnosis/result.
CONDITION_TESTS = [
    (("diabet", "glucose", "sugar", "hba1c"), "HBA1C"),
    (("kidney", "renal", "creatinine", "nephro"), "KFT"),
    (("liver", "hepatic", "jaundice"), "LFT"),
    (("thyroid", "tsh", "hypothyroid", "hyperthyroid"), "TFT"),
    (("cholesterol", "lipid", "cardiac", "heart"), "LIPID"),
    (("urine", "urinary", "uti"), "URINE-RM"),
    (("infection", "fever", "microbial", "culture"), "CRP"),
    (("anemia", "anaemia", "haemoglobin", "hemoglobin"), "CBC"),
]
DEFAULT_TESTS = ("CBC", "GLU-FAST", "URINE-RM")


def safe_token(value: str) -> str:
    token = re.sub(r"[^A-Za-z0-9_-]+", "-", value or "PATIENT").strip("-")
    return token[:28] or "PATIENT"


def main():
    db = SessionLocal()
    created_samples = created_reports = skipped_existing = 0
    try:
        tests = {t.test_code: t for t in db.scalars(select(LabTest).where(LabTest.is_active.is_(True))).all()}
        if not tests:
            raise RuntimeError("No active laboratory tests found. Run seed_laboratory_catalogue.py first.")

        patients = db.scalars(select(Patient).where(Patient.is_active.is_(True)).order_by(Patient.id)).all()
        if not patients:
            print("No active patients found; no demo samples/reports created.")
            return

        # Ensure at least one active lab/test exists for the fallback tests.
        fallback = [code for code in DEFAULT_TESTS if code in tests]
        if not fallback:
            fallback = [next(iter(tests.keys()))]

        now = datetime.now(timezone.utc)
        for patient in patients:
            documented = " ".join(filter(None, [getattr(patient, "chronic_conditions", None), getattr(patient, "allergies", None)])).lower()
            selected = []
            for keywords, code in CONDITION_TESTS:
                if code in tests and any(word in documented for word in keywords):
                    selected.append(code)
            # Always create at least one report; add generic demo panels for patients without documented condition keywords.
            if not selected:
                selected = fallback[:1]
            selected = list(dict.fromkeys(selected))[:3]
            patient_token = safe_token(getattr(patient, "patient_number", str(patient.id)))

            for code in selected:
                test = tests[code]
                sample_number = f"DEMO-{patient_token}-{code}"[:50]
                sample = db.scalar(select(LabSample).where(LabSample.sample_number == sample_number))
                if sample is None:
                    sample = LabSample(
                        sample_number=sample_number,
                        patient_id=patient.id,
                        lab_test_id=test.id,
                        collected_at=now,
                        received_at=now,
                        status="completed",
                        notes="SIMULATED DEMO DATA ONLY — not a real specimen.",
                    )
                    db.add(sample)
                    db.flush()
                    created_samples += 1

                report_number = f"DEMO-RPT-{patient_token}-{code}"[:50]
                report = db.scalar(select(LabReport).where(LabReport.sample_id == sample.id))
                if report is None:
                    report = db.scalar(select(LabReport).where(LabReport.report_number == report_number))
                if report is None:
                    db.add(LabReport(
                        report_number=report_number,
                        sample_id=sample.id,
                        result=(
                            "SIMULATED DEMO REPORT ONLY. No measured clinical value is recorded. "
                            "Replace with a verified result from an authorized laboratory professional."
                        ),
                        interpretation="DEMO ONLY — NOT FOR CLINICAL DECISIONS.",
                        status="completed",
                        reported_at=now,
                        remarks=(
                            f"Automatically generated development record for test {test.name}. "
                            "This is not a real test result and must not be used for diagnosis or treatment."
                        ),
                    ))
                    created_reports += 1
                else:
                    skipped_existing += 1

        db.commit()
        print("DEMO LAB DATA SEED COMPLETE")
        print(f"Active patients checked: {len(patients)}")
        print(f"Demo samples created: {created_samples}")
        print(f"Demo reports created: {created_reports}")
        print(f"Existing reports preserved/skipped: {skipped_existing}")
        print("IMPORTANT: All generated results are explicitly DEMO ONLY; no clinical values were fabricated.")
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
