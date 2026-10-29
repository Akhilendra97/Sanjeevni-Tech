from datetime import date

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.diagnosis import Diagnosis
from app.models.doctor import Doctor
from app.models.patient import Patient


def create_diagnosis(
    db: Session,
    *,
    patient_id: int,
    doctor_id: int,
    diagnosis_code: str,
    diagnosis_name: str,
    diagnosis_type: str = "primary",
    description: str | None = None,
    symptoms: str | None = None,
    severity: str | None = None,
    diagnosis_date: date,
    notes: str | None = None,
) -> Diagnosis:

    patient = db.get(Patient, patient_id)
    if patient is None:
        raise ValueError("Patient not found.")

    doctor = db.get(Doctor, doctor_id)
    if doctor is None:
        raise ValueError("Doctor not found.")

    existing = db.scalar(
        select(Diagnosis).where(
            Diagnosis.diagnosis_code == diagnosis_code
        )
    )

    if existing is not None:
        raise ValueError("Diagnosis code already exists.")

    diagnosis = Diagnosis(
        patient_id=patient_id,
        doctor_id=doctor_id,
        diagnosis_code=diagnosis_code,
        diagnosis_name=diagnosis_name,
        diagnosis_type=diagnosis_type,
        description=description,
        symptoms=symptoms,
        severity=severity,
        diagnosis_date=diagnosis_date,
        notes=notes,
    )

    db.add(diagnosis)
    db.commit()
    db.refresh(diagnosis)

    return diagnosis


def get_diagnosis_by_id(
    db: Session,
    diagnosis_id: int,
) -> Diagnosis | None:

    return db.get(Diagnosis, diagnosis_id)


def list_diagnoses(
    db: Session,
) -> list[Diagnosis]:

    statement = select(Diagnosis).order_by(
        Diagnosis.diagnosis_date.desc(),
        Diagnosis.id.desc(),
    )

    return list(db.scalars(statement).all())


def list_patient_diagnoses(
    db: Session,
    patient_id: int,
) -> list[Diagnosis]:

    statement = (
        select(Diagnosis)
        .where(Diagnosis.patient_id == patient_id)
        .order_by(
            Diagnosis.diagnosis_date.desc(),
            Diagnosis.id.desc(),
        )
    )

    return list(db.scalars(statement).all())


def update_diagnosis(
    db: Session,
    diagnosis: Diagnosis,
    *,
    diagnosis_name: str | None = None,
    diagnosis_type: str | None = None,
    description: str | None = None,
    symptoms: str | None = None,
    severity: str | None = None,
    diagnosis_date: date | None = None,
    notes: str | None = None,
) -> Diagnosis:

    if diagnosis_name is not None:
        diagnosis.diagnosis_name = diagnosis_name

    if diagnosis_type is not None:
        diagnosis.diagnosis_type = diagnosis_type

    if description is not None:
        diagnosis.description = description

    if symptoms is not None:
        diagnosis.symptoms = symptoms

    if severity is not None:
        diagnosis.severity = severity

    if diagnosis_date is not None:
        diagnosis.diagnosis_date = diagnosis_date

    if notes is not None:
        diagnosis.notes = notes

    db.commit()
    db.refresh(diagnosis)

    return diagnosis


def delete_diagnosis(
    db: Session,
    diagnosis: Diagnosis,
) -> None:

    db.delete(diagnosis)
    db.commit()
