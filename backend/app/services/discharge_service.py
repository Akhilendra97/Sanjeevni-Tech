from sqlalchemy.orm import Session

from app.models.discharge import Discharge


def create_discharge(
    db: Session,
    *,
    admission_id: int,
    patient_id: int,
    doctor_id: int,
    discharge_number: str,
    discharge_date,
    discharge_type: str,
    final_diagnosis: str | None,
    treatment_summary: str | None,
    medications: str | None,
    follow_up_instructions: str | None,
    condition_at_discharge: str | None,
    notes: str | None,
) -> Discharge:

    discharge = Discharge(
        admission_id=admission_id,
        patient_id=patient_id,
        doctor_id=doctor_id,
        discharge_number=discharge_number,
        discharge_date=discharge_date,
        discharge_type=discharge_type,
        final_diagnosis=final_diagnosis,
        treatment_summary=treatment_summary,
        medications=medications,
        follow_up_instructions=follow_up_instructions,
        condition_at_discharge=condition_at_discharge,
        notes=notes,
    )

    db.add(discharge)
    db.commit()
    db.refresh(discharge)

    return discharge


def list_discharges(db: Session) -> list[Discharge]:
    return (
        db.query(Discharge)
        .order_by(Discharge.id.desc())
        .all()
    )


def get_discharge_by_id(
    db: Session,
    discharge_id: int,
) -> Discharge | None:
    return (
        db.query(Discharge)
        .filter(Discharge.id == discharge_id)
        .first()
    )


def update_discharge(
    db: Session,
    discharge: Discharge,
    **kwargs,
) -> Discharge:

    for field, value in kwargs.items():
        if value is not None:
            setattr(discharge, field, value)

    db.commit()
    db.refresh(discharge)

    return discharge


def delete_discharge(
    db: Session,
    discharge: Discharge,
) -> None:

    db.delete(discharge)
    db.commit()