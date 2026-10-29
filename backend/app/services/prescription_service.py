from datetime import date

from sqlalchemy.orm import Session

from app.models.prescription import Prescription


def create_prescription(
    db: Session,
    *,
    prescription_number: str,
    patient_id: int,
    doctor_id: int,
    prescription_date: date,
    diagnosis: str | None = None,
    medicines: str,
    instructions: str | None = None,
    duration: str | None = None,
    follow_up_date: date | None = None,
    notes: str | None = None,
) -> Prescription:

    existing = (
        db.query(Prescription)
        .filter(
            Prescription.prescription_number
            == prescription_number
        )
        .first()
    )

    if existing:
        raise ValueError(
            "Prescription number already exists."
        )

    prescription = Prescription(
        prescription_number=prescription_number,
        patient_id=patient_id,
        doctor_id=doctor_id,
        prescription_date=prescription_date,
        diagnosis=diagnosis,
        medicines=medicines,
        instructions=instructions,
        duration=duration,
        follow_up_date=follow_up_date,
        notes=notes,
    )

    db.add(prescription)
    db.commit()
    db.refresh(prescription)

    return prescription


def get_prescription_by_id(
    db: Session,
    prescription_id: int,
) -> Prescription | None:

    return (
        db.query(Prescription)
        .filter(Prescription.id == prescription_id)
        .first()
    )


def list_prescriptions(
    db: Session,
) -> list[Prescription]:

    return (
        db.query(Prescription)
        .order_by(Prescription.id.desc())
        .all()
    )


def update_prescription(
    db: Session,
    prescription: Prescription,
    *,
    prescription_date: date | None = None,
    diagnosis: str | None = None,
    medicines: str | None = None,
    instructions: str | None = None,
    duration: str | None = None,
    follow_up_date: date | None = None,
    notes: str | None = None,
) -> Prescription:

    if prescription_date is not None:
        prescription.prescription_date = prescription_date

    if diagnosis is not None:
        prescription.diagnosis = diagnosis

    if medicines is not None:
        prescription.medicines = medicines

    if instructions is not None:
        prescription.instructions = instructions

    if duration is not None:
        prescription.duration = duration

    if follow_up_date is not None:
        prescription.follow_up_date = follow_up_date

    if notes is not None:
        prescription.notes = notes

    db.commit()
    db.refresh(prescription)

    return prescription


def delete_prescription(
    db: Session,
    prescription: Prescription,
) -> None:

    db.delete(prescription)
    db.commit()