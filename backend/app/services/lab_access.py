from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.models.user import User
from app.models.lab import Lab
from app.models.lab_test import LabTest
from app.models.lab_sample import LabSample
from app.models.lab_report import LabReport

# Explicit mapping for the 11 lab accounts created by the project seeder.
LAB_ACCOUNT_NAMES = {
    "lab_lab_hema": "Hematology Laboratory",
    "lab_lab_bio": "Clinical Biochemistry",
    "lab_lab_micro": "Clinical Microbiology",
    "lab_lab_histo": "Histopathology Laboratory",
    "lab_lab_path": "Clinical Pathology",
    "lab_lab_immuno": "Immunology Laboratory",
    "lab_lab_sero": "Serology Laboratory",
    "lab_lab_molec": "Molecular Diagnostics",
    "lab_lab_tox": "Clinical Toxicology",
    "lab_lab_urine": "Urinalysis Laboratory",
    "lab_lab_bb": "Blood Bank & Transfusion",
}

def lab_id_for_payload(db: Session, payload: dict) -> int | None:
    role = str(payload.get("role", "")).lower()
    if role != "laboratory":
        return None
    username = str(payload.get("username", "")).strip().lower()
    if not username:
        try:
            uid = int(payload.get("sub"))
        except (TypeError, ValueError):
            raise HTTPException(status_code=401, detail="Invalid authenticated user.")
        user = db.get(User, uid)
        username = user.username.lower() if user else ""
    lab_name = LAB_ACCOUNT_NAMES.get(username)
    if not lab_name:
        raise HTTPException(status_code=403, detail="Laboratory account is not mapped to a facility.")
    lab = db.query(Lab).filter(Lab.name == lab_name, Lab.is_active.is_(True)).first()
    if not lab:
        raise HTTPException(status_code=403, detail="Assigned laboratory is missing or inactive.")
    return lab.id

def require_sample_lab(db: Session, sample_id: int, lab_id: int) -> LabSample:
    sample = (db.query(LabSample).join(LabTest, LabSample.lab_test_id == LabTest.id)
              .filter(LabSample.id == sample_id, LabTest.lab_id == lab_id).first())
    if not sample:
        raise HTTPException(status_code=404, detail="Laboratory sample not found.")
    return sample

def require_report_lab(db: Session, report_id: int, lab_id: int) -> LabReport:
    report = (db.query(LabReport).join(LabSample, LabReport.sample_id == LabSample.id)
              .join(LabTest, LabSample.lab_test_id == LabTest.id)
              .filter(LabReport.id == report_id, LabTest.lab_id == lab_id).first())
    if not report:
        raise HTTPException(status_code=404, detail="Laboratory report not found.")
    return report
