from datetime import date

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.constants import AdmissionStatus, BedStatus
from app.models.admission import Admission
from app.models.bed import Bed
from app.models.doctor import Doctor
from app.models.patient import Patient
from app.models.ward import Ward


def create_admission(
    db: Session,
    *,
    admission_number: str,
    patient_id: int,
    doctor_id: int,
    ward_id: int | None,
    bed_id: int | None,
    admission_date: date,
    status: str,
    reason: str | None,
    diagnosis: str | None,
    notes: str | None,
    discharge_summary: str | None,
) -> Admission:

    existing = db.scalar(
        select(Admission).where(
            Admission.admission_number == admission_number
        )
    )

    if existing is not None:
        raise ValueError(
            "Admission number already exists."
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

    ward = None

    if ward_id is not None:
        ward = db.get(Ward, ward_id)

        if ward is None:
            raise ValueError(
                "Ward not found."
            )

        if not ward.is_active:
            raise ValueError(
                "Ward is inactive."
            )

    bed = None

    if bed_id is not None:
        bed = db.get(Bed, bed_id)

        if bed is None:
            raise ValueError(
                "Bed not found."
            )

        if not bed.is_active:
            raise ValueError(
                "Bed is inactive."
            )

        if bed.status != BedStatus.AVAILABLE.value:
            raise ValueError(
                "Bed is not available."
            )

        if ward_id is None:
            raise ValueError(
                "ward_id is required when bed_id is provided."
            )

        if bed.ward_id != ward_id:
            raise ValueError(
                "Bed does not belong to the selected ward."
            )

    admission = Admission(
        admission_number=admission_number,
        patient_id=patient_id,
        doctor_id=doctor_id,
        ward_id=ward_id,
        bed_id=bed_id,
        admission_date=admission_date,
        status=status,
        reason=reason,
        diagnosis=diagnosis,
        notes=notes,
        discharge_summary=discharge_summary,
    )

    db.add(admission)

    if bed is not None:
        bed.status = BedStatus.OCCUPIED.value

    db.commit()
    db.refresh(admission)

    return admission


def list_admissions(
    db: Session,
) -> list[Admission]:

    statement = select(Admission).order_by(
        Admission.id.desc()
    )

    return list(
        db.scalars(statement).all()
    )


def get_admission_by_id(
    db: Session,
    admission_id: int,
) -> Admission | None:

    return db.get(
        Admission,
        admission_id,
    )


def update_admission(
    db: Session,
    admission: Admission,
    *,
    ward_id: int | None,
    bed_id: int | None,
    discharge_date: date | None,
    status: str | None,
    reason: str | None,
    diagnosis: str | None,
    notes: str | None,
    discharge_summary: str | None,
) -> Admission:

    old_bed = None

    if admission.bed_id is not None:
        old_bed = db.get(
            Bed,
            admission.bed_id,
        )

    if ward_id is not None:
        ward = db.get(Ward, ward_id)

        if ward is None:
            raise ValueError(
                "Ward not found."
            )

        if not ward.is_active:
            raise ValueError(
                "Ward is inactive."
            )

    new_bed = None

    if bed_id is not None:
        new_bed = db.get(Bed, bed_id)

        if new_bed is None:
            raise ValueError(
                "Bed not found."
            )

        if not new_bed.is_active:
            raise ValueError(
                "Bed is inactive."
            )

        if new_bed.status != BedStatus.AVAILABLE.value:
            if new_bed.id != admission.bed_id:
                raise ValueError(
                    "Bed is not available."
                )

        if ward_id is None:
            ward_id = new_bed.ward_id

        if new_bed.ward_id != ward_id:
            raise ValueError(
                "Bed does not belong to the selected ward."
            )

    if ward_id is not None:
        admission.ward_id = ward_id

    if bed_id is not None:
        admission.bed_id = bed_id

        if old_bed is not None and old_bed.id != bed_id:
            old_bed.status = BedStatus.AVAILABLE.value

        new_bed.status = BedStatus.OCCUPIED.value

    if discharge_date is not None:
        admission.discharge_date = discharge_date

    if status is not None:
        admission.status = status

        if status == AdmissionStatus.DISCHARGED.value:
            if admission.discharge_date is None:
                admission.discharge_date = date.today()

            if old_bed is not None:
                old_bed.status = BedStatus.AVAILABLE.value

            if new_bed is not None:
                new_bed.status = BedStatus.AVAILABLE.value

    if reason is not None:
        admission.reason = reason

    if diagnosis is not None:
        admission.diagnosis = diagnosis

    if notes is not None:
        admission.notes = notes

    if discharge_summary is not None:
        admission.discharge_summary = discharge_summary

    db.commit()
    db.refresh(admission)

    return admission


def delete_admission(
    db: Session,
    admission: Admission,
) -> None:

    if admission.bed_id is not None:
        bed = db.get(
            Bed,
            admission.bed_id,
        )

        if bed is not None:
            bed.status = BedStatus.AVAILABLE.value

    db.delete(admission)

    db.commit()