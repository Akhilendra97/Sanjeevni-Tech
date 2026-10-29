from __future__ import annotations

from datetime import datetime

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.admission import Admission
from app.models.bed import Bed
from app.models.doctor import Doctor
from app.models.icu import ICU
from app.models.nurse import Nurse
from app.models.patient import Patient
from app.models.ward import Ward
from app.schemas.icu import ICUCreate, ICUUpdate


class ICUService:

    @staticmethod
    def _validate_references(
        db: Session,
        *,
        admission_id: int,
        patient_id: int,
        doctor_id: int,
        nurse_id: int | None,
        ward_id: int | None,
        bed_id: int | None,
    ) -> None:

        admission = db.get(Admission, admission_id)
        if not admission:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Admission not found",
            )

        patient = db.get(Patient, patient_id)
        if not patient:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Patient not found",
            )

        doctor = db.get(Doctor, doctor_id)
        if not doctor:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Doctor not found",
            )

        if nurse_id is not None:
            nurse = db.get(Nurse, nurse_id)
            if not nurse:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Nurse not found",
                )

        ward = None
        if ward_id is not None:
            ward = db.get(Ward, ward_id)
            if not ward:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Ward not found",
                )

        if bed_id is not None:
            bed = db.get(Bed, bed_id)
            if not bed:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Bed not found",
                )

            if ward_id is not None and bed.ward_id != ward_id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Bed does not belong to the selected ward",
                )

    @staticmethod
    def create(
        db: Session,
        data: ICUCreate,
    ) -> ICU:

        existing = db.scalar(
            select(ICU).where(ICU.icu_number == data.icu_number)
        )

        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="ICU number already exists",
            )

        ICUService._validate_references(
            db,
            admission_id=data.admission_id,
            patient_id=data.patient_id,
            doctor_id=data.doctor_id,
            nurse_id=data.nurse_id,
            ward_id=data.ward_id,
            bed_id=data.bed_id,
        )

        icu = ICU(**data.model_dump())

        db.add(icu)
        db.commit()
        db.refresh(icu)

        return icu

    @staticmethod
    def get(
        db: Session,
        icu_id: int,
    ) -> ICU:

        icu = db.get(ICU, icu_id)

        if not icu:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="ICU record not found",
            )

        return icu

    @staticmethod
    def get_by_number(
        db: Session,
        icu_number: str,
    ) -> ICU:

        icu = db.scalar(
            select(ICU).where(ICU.icu_number == icu_number)
        )

        if not icu:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="ICU record not found",
            )

        return icu

    @staticmethod
    def list(
        db: Session,
        *,
        patient_id: int | None = None,
        doctor_id: int | None = None,
        nurse_id: int | None = None,
        ward_id: int | None = None,
        bed_id: int | None = None,
        status_value: str | None = None,
        icu_type: str | None = None,
        ventilator_required: bool | None = None,
    ) -> list[ICU]:

        query = select(ICU).order_by(ICU.id.desc())

        if patient_id is not None:
            query = query.where(ICU.patient_id == patient_id)

        if doctor_id is not None:
            query = query.where(ICU.doctor_id == doctor_id)

        if nurse_id is not None:
            query = query.where(ICU.nurse_id == nurse_id)

        if ward_id is not None:
            query = query.where(ICU.ward_id == ward_id)

        if bed_id is not None:
            query = query.where(ICU.bed_id == bed_id)

        if status_value is not None:
            query = query.where(ICU.status == status_value)

        if icu_type is not None:
            query = query.where(ICU.icu_type == icu_type)

        if ventilator_required is not None:
            query = query.where(
                ICU.ventilator_required == ventilator_required
            )

        return list(db.scalars(query).all())

    @staticmethod
    def update(
        db: Session,
        icu_id: int,
        data: ICUUpdate,
    ) -> ICU:

        icu = ICUService.get(db, icu_id)

        update_data = data.model_dump(exclude_unset=True)

        if "icu_number" in update_data:
            existing = db.scalar(
                select(ICU).where(
                    ICU.icu_number == update_data["icu_number"],
                    ICU.id != icu_id,
                )
            )

            if existing:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="ICU number already exists",
                )

        admission_id = update_data.get(
            "admission_id",
            icu.admission_id,
        )

        patient_id = update_data.get(
            "patient_id",
            icu.patient_id,
        )

        doctor_id = update_data.get(
            "doctor_id",
            icu.doctor_id,
        )

        nurse_id = update_data.get(
            "nurse_id",
            icu.nurse_id,
        )

        ward_id = update_data.get(
            "ward_id",
            icu.ward_id,
        )

        bed_id = update_data.get(
            "bed_id",
            icu.bed_id,
        )

        ICUService._validate_references(
            db,
            admission_id=admission_id,
            patient_id=patient_id,
            doctor_id=doctor_id,
            nurse_id=nurse_id,
            ward_id=ward_id,
            bed_id=bed_id,
        )

        for field, value in update_data.items():
            setattr(icu, field, value)

        db.commit()
        db.refresh(icu)

        return icu

    @staticmethod
    def discharge(
        db: Session,
        icu_id: int,
        discharge_time: datetime | None = None,
    ) -> ICU:

        icu = ICUService.get(db, icu_id)

        if icu.status == "discharged":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="ICU record is already discharged",
            )

        icu.status = "discharged"
        icu.discharge_time = discharge_time or datetime.now()

        db.commit()
        db.refresh(icu)

        return icu

    @staticmethod
    def delete(
        db: Session,
        icu_id: int,
    ) -> None:

        icu = ICUService.get(db, icu_id)

        db.delete(icu)
        db.commit()
