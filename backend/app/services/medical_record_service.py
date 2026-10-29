from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.doctor import Doctor
from app.models.medical_record import MedicalRecord
from app.models.patient import Patient


def create_medical_record(
    db: Session,
    *,
    patient_id: int,
    doctor_id: int,
    record_number: str,
    chief_complaint: str | None,
    symptoms: str | None,
    diagnosis: str | None,
    treatment_plan: str | None,
    clinical_notes: str | None,
    medical_history: str | None,
    allergies: str | None,
    record_type: str,
) -> MedicalRecord:

    existing = db.scalar(
        select(MedicalRecord).where(
            MedicalRecord.record_number == record_number
        )
    )

    if existing is not None:
        raise ValueError(
            "Medical record number already exists."
        )

    patient = db.get(Patient, patient_id)

    if patient is None:
        raise ValueError(
            "Patient not found."
        )

    doctor = db.get(Doctor, doctor_id)

    if doctor is None:
        raise ValueError(
            "Doctor not found."
        )

    record = MedicalRecord(
        patient_id=patient_id,
        doctor_id=doctor_id,
        record_number=record_number,
        chief_complaint=chief_complaint,
        symptoms=symptoms,
        diagnosis=diagnosis,
        treatment_plan=treatment_plan,
        clinical_notes=clinical_notes,
        medical_history=medical_history,
        allergies=allergies,
        record_type=record_type,
    )

    db.add(record)
    db.commit()
    db.refresh(record)

    return record


def list_medical_records(
    db: Session,
) -> list[MedicalRecord]:

    statement = select(MedicalRecord).order_by(
        MedicalRecord.id.desc()
    )

    return list(
        db.scalars(statement).all()
    )


def get_medical_record_by_id(
    db: Session,
    record_id: int,
) -> MedicalRecord | None:

    return db.get(
        MedicalRecord,
        record_id,
    )


def update_medical_record(
    db: Session,
    record: MedicalRecord,
    *,
    chief_complaint: str | None,
    symptoms: str | None,
    diagnosis: str | None,
    treatment_plan: str | None,
    clinical_notes: str | None,
    medical_history: str | None,
    allergies: str | None,
    record_type: str | None,
) -> MedicalRecord:

    if chief_complaint is not None:
        record.chief_complaint = chief_complaint

    if symptoms is not None:
        record.symptoms = symptoms

    if diagnosis is not None:
        record.diagnosis = diagnosis

    if treatment_plan is not None:
        record.treatment_plan = treatment_plan

    if clinical_notes is not None:
        record.clinical_notes = clinical_notes

    if medical_history is not None:
        record.medical_history = medical_history

    if allergies is not None:
        record.allergies = allergies

    if record_type is not None:
        record.record_type = record_type

    db.commit()
    db.refresh(record)

    return record


def delete_medical_record(
    db: Session,
    record: MedicalRecord,
) -> None:

    db.delete(record)
    db.commit()