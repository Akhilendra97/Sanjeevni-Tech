from __future__ import annotations
import re
import shutil
from datetime import datetime
from pathlib import Path

APPOINTMENTS = Path("app/routers/appointments.py")
PATIENTS = Path("app/routers/patients.py")
STAMP = datetime.now().strftime("%Y%m%d_%H%M%S")

def fail(message):
    raise SystemExit("ERROR: " + message + " No intentional data changes were made.")

def patch_appointments(source):
    if "from app.models.doctor import Doctor" not in source:
        anchor = "from app.models.patient import Patient"
        if anchor not in source:
            fail("Could not locate Patient import in appointments.py.")
        source = source.replace(anchor, anchor + "\nfrom app.models.doctor import Doctor", 1)

    old = "    return list_appointments(db)\n\n\n@router.get(\n    \"/{appointment_id}\","
    new = '''    if payload.get("role") == UserRole.DOCTOR.value:
        try:
            user_id = int(payload.get("sub"))
        except (TypeError, ValueError):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid authenticated doctor account.")
        doctor = db.query(Doctor).filter(Doctor.user_id == user_id).first()
        if doctor is None:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No doctor profile is linked to this account.")
        return db.query(Appointment).filter(Appointment.doctor_id == doctor.id).order_by(
            Appointment.appointment_date.asc(), Appointment.appointment_time.asc()
        ).all()

    return list_appointments(db)


@router.get(
    "/{appointment_id}",'''
    if old in source:
        source = source.replace(old, new, 1)
    elif "Appointment.doctor_id == doctor.id" not in source:
        fail("Could not locate GET /appointments list endpoint.")

    anchor = "    _ensure_appointment_access(\n        appointment,\n        payload,\n    )\n\n    return appointment"
    replacement = '''    _ensure_appointment_access(
        appointment,
        payload,
    )

    if payload.get("role") == UserRole.DOCTOR.value:
        try:
            user_id = int(payload.get("sub"))
        except (TypeError, ValueError):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid authenticated doctor account.")
        doctor = db.query(Doctor).filter(Doctor.user_id == user_id).first()
        if doctor is None or appointment.doctor_id != doctor.id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Appointment not found.")

    return appointment'''
    if anchor in source:
        source = source.replace(anchor, replacement, 1)
    elif 'appointment.doctor_id != doctor.id' not in source:
        fail("Could not locate appointment detail access check.")
    return source

def patch_patients(source):
    if "from app.models.doctor import Doctor" not in source:
        anchor = "from app.models.patient import Patient"
        if anchor not in source:
            fail("Could not locate Patient import in patients.py.")
        source = source.replace(anchor, anchor + "\nfrom app.models.doctor import Doctor", 1)
    if "from app.models.diagnosis import Diagnosis" not in source:
        source = source.replace("from app.models.doctor import Doctor", "from app.models.doctor import Doctor\nfrom app.models.diagnosis import Diagnosis", 1)

    pattern = re.compile(
        r'(@router\.get\(\s*""\s*,\s*response_model=list\[PatientResponse\]\s*,\s*\)\s*'
        r'def list_patients\([\s\S]*?\n\) -> list\[Patient\]:\s*\n)([\s\S]*?)(?=\n@router\.(?:get|post|patch|delete)\()',
        re.M,
    )
    match = pattern.search(source)
    if not match:
        fail("Could not locate list_patients endpoint in patients.py.")
    header, body = match.group(1), match.group(2)
    if 'current_user.get("role") == UserRole.DOCTOR.value' in body:
        return source
    header = header.replace("_: dict = Depends(", "current_user: dict = Depends(", 1)
    new_body = '''
    if current_user.get("role") == UserRole.DOCTOR.value:
        try:
            user_id = int(current_user.get("sub"))
        except (TypeError, ValueError):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid authenticated doctor account.")
        doctor = db.query(Doctor).filter(Doctor.user_id == user_id).first()
        if doctor is None:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No doctor profile is linked to this account.")
        query = db.query(Patient).join(Diagnosis, Diagnosis.patient_id == Patient.id).filter(
            Diagnosis.doctor_id == doctor.id
        ).distinct()
        if search and search.strip():
            term = f"%{search.strip()}%"
            query = query.filter(
                Patient.first_name.ilike(term)
                | Patient.last_name.ilike(term)
                | Patient.patient_number.ilike(term)
                | Patient.phone.ilike(term)
                | Patient.email.ilike(term)
            )
        return query.order_by(Patient.id.asc()).offset(skip).limit(limit).all()

    return get_patients(db, skip=skip, limit=limit, search=search)
'''
    return source[:match.start()] + header + new_body + source[match.end():]

def main():
    missing = [str(p) for p in (APPOINTMENTS, PATIENTS) if not p.exists()]
    if missing:
        fail("Run this script from backend; missing: " + ", ".join(missing))
    originals = {APPOINTMENTS: APPOINTMENTS.read_text(encoding="utf-8-sig"),
                 PATIENTS: PATIENTS.read_text(encoding="utf-8-sig")}
    patched = {APPOINTMENTS: patch_appointments(originals[APPOINTMENTS]),
               PATIENTS: patch_patients(originals[PATIENTS])}
    for path, content in patched.items():
        try:
            compile(content, str(path), "exec")
        except Exception as exc:
            fail(f"Syntax check failed for {path}: {exc}")
    backups = {}
    for path in patched:
        backup = path.with_name(f"{path.name}.before_doctor_scope_{STAMP}.bak")
        shutil.copy2(path, backup)
        backups[path] = backup
    try:
        for path, content in patched.items():
            path.write_text(content, encoding="utf-8")
        for path in patched:
            compile(path.read_text(encoding="utf-8"), str(path), "exec")
    except Exception:
        for path, content in originals.items():
            path.write_text(content, encoding="utf-8")
        fail("Write/validation failed; originals restored.")
    print("SUCCESS: doctor-specific appointment and patient filtering applied.")
    print("Appointment backup:", backups[APPOINTMENTS].resolve())
    print("Patient backup:", backups[PATIENTS].resolve())
    print("No database rows changed or deleted. Restart FastAPI and refresh browser.")

if __name__ == "__main__":
    main()
