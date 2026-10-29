from __future__ import annotations
import re
import shutil
from datetime import datetime
from pathlib import Path

TARGET = Path("app") / "routers" / "patients.py"

REPLACEMENT = """@router.get(
    "",
    response_model=list[PatientResponse],
)
def list_patients(
    search: str | None = Query(default=None, max_length=100),
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=500),
    db: Session = Depends(get_db),
    current_user: dict = Depends(
        require_role(
            UserRole.ADMIN,
            UserRole.DOCTOR,
            UserRole.NURSE,
            UserRole.RECEPTIONIST,
        )
    ),
) -> list[Patient]:
    # Doctors see only patients assigned through Diagnosis.doctor_id.
    # Admin, nurse, and receptionist keep the existing all-patient behavior.
    if current_user.get("role") == UserRole.DOCTOR.value:
        try:
            user_id = int(current_user.get("sub"))
        except (TypeError, ValueError):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authenticated doctor account.",
            )

        doctor = db.query(Doctor).filter(Doctor.user_id == user_id).first()
        if doctor is None:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No doctor profile is linked to this account.",
            )

        query = (
            db.query(Patient)
            .join(Diagnosis, Diagnosis.patient_id == Patient.id)
            .filter(Diagnosis.doctor_id == doctor.id)
            .distinct()
        )

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


"""

def main():
    if not TARGET.exists():
        raise SystemExit(f"ERROR: {TARGET} not found. Run from the backend folder.")

    source = TARGET.read_text(encoding="utf-8")
    pattern = re.compile(
        r'@router\.get\(\s*""\s*,\s*response_model=list\[PatientResponse\]\s*,\s*\)\s*def list_patients\(',
        re.M,
    )
    match = pattern.search(source)
    if not match:
        raise SystemExit("ERROR: Could not locate list_patients endpoint; no files changed.")

    start = match.start()
    next_route = source.find("\n@router.get(", match.end())
    if next_route < 0:
        raise SystemExit("ERROR: Could not locate next route boundary; no files changed.")

    old_block = source[start:next_route]
    if 'current_user.get("role") == UserRole.DOCTOR.value' in old_block:
        print("Already patched; no changes made.")
        return

    patched = source[:start] + REPLACEMENT + source[next_route + 1:]

    if "from app.models.doctor import Doctor" not in patched:
        anchor = "from app.models.patient import Patient"
        if anchor not in patched:
            raise SystemExit("ERROR: Patient model import not found; no changes made.")
        patched = patched.replace(
            anchor,
            anchor + "\nfrom app.models.doctor import Doctor\nfrom app.models.diagnosis import Diagnosis",
            1,
        )
    elif "from app.models.diagnosis import Diagnosis" not in patched:
        patched = patched.replace(
            "from app.models.doctor import Doctor",
            "from app.models.doctor import Doctor\nfrom app.models.diagnosis import Diagnosis",
            1,
        )

    backup = TARGET.with_name(
        f"patients.py.before_doctor_filter_{datetime.now().strftime('%Y%m%d_%H%M%S')}.bak"
    )
    shutil.copy2(TARGET, backup)
    TARGET.write_text(patched, encoding="utf-8")

    try:
        compile(patched, str(TARGET), "exec")
    except Exception:
        shutil.copy2(backup, TARGET)
        raise

    print("SUCCESS: doctor-specific patient filtering patched.")
    print(f"Backup: {backup.resolve()}")
    print("Doctors see only patients linked via Diagnosis.doctor_id.")
    print("Admin, nurse, and receptionist behavior remains unchanged.")
    print("Restart FastAPI and reload frontend.")

if __name__ == "__main__":
    main()
