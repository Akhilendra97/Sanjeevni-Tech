from sqlalchemy.orm import Session

from app.models.patient import Patient
from app.models.vital import Vital


def create_vital(
    db: Session,
    *,
    patient_id: int,
    temperature: float | None = None,
    heart_rate: int | None = None,
    respiratory_rate: int | None = None,
    systolic_bp: int | None = None,
    diastolic_bp: int | None = None,
    oxygen_saturation: float | None = None,
    blood_glucose: float | None = None,
    weight: float | None = None,
    height: float | None = None,
    notes: str | None = None,
) -> Vital:

    patient = (
        db.query(Patient)
        .filter(Patient.id == patient_id)
        .first()
    )

    if patient is None:
        raise ValueError("Patient not found.")

    vital = Vital(
        patient_id=patient_id,
        temperature=temperature,
        heart_rate=heart_rate,
        respiratory_rate=respiratory_rate,
        systolic_bp=systolic_bp,
        diastolic_bp=diastolic_bp,
        oxygen_saturation=oxygen_saturation,
        blood_glucose=blood_glucose,
        weight=weight,
        height=height,
        notes=notes,
    )

    db.add(vital)
    db.commit()
    db.refresh(vital)

    return vital


def list_vitals(
    db: Session,
    *,
    patient_id: int | None = None,
) -> list[Vital]:

    query = db.query(Vital)

    if patient_id is not None:
        query = query.filter(
            Vital.patient_id == patient_id
        )

    return query.order_by(
        Vital.recorded_at.desc()
    ).all()


def get_vital_by_id(
    db: Session,
    vital_id: int,
) -> Vital | None:

    return (
        db.query(Vital)
        .filter(Vital.id == vital_id)
        .first()
    )


def update_vital(
    db: Session,
    vital: Vital,
    *,
    temperature: float | None = None,
    heart_rate: int | None = None,
    respiratory_rate: int | None = None,
    systolic_bp: int | None = None,
    diastolic_bp: int | None = None,
    oxygen_saturation: float | None = None,
    blood_glucose: float | None = None,
    weight: float | None = None,
    height: float | None = None,
    notes: str | None = None,
) -> Vital:

    updates = {
        "temperature": temperature,
        "heart_rate": heart_rate,
        "respiratory_rate": respiratory_rate,
        "systolic_bp": systolic_bp,
        "diastolic_bp": diastolic_bp,
        "oxygen_saturation": oxygen_saturation,
        "blood_glucose": blood_glucose,
        "weight": weight,
        "height": height,
        "notes": notes,
    }

    for field, value in updates.items():
        if value is not None:
            setattr(vital, field, value)

    db.commit()
    db.refresh(vital)

    return vital


def delete_vital(
    db: Session,
    vital: Vital,
) -> None:

    db.delete(vital)
    db.commit()