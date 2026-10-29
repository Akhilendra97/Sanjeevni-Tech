from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.models.doctor import Doctor
from app.models.patient import Patient
from app.models.radiology import Radiology
from app.schemas.radiology import RadiologyCreate, RadiologyUpdate


class RadiologyService:

    @staticmethod
    def create(
        db: Session,
        data: RadiologyCreate,
    ) -> Radiology:

        existing = db.scalar(
            select(Radiology).where(
                Radiology.radiology_number == data.radiology_number
            )
        )

        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Radiology number already exists",
            )

        patient = db.get(Patient, data.patient_id)

        if not patient:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Patient not found",
            )

        doctor = db.get(Doctor, data.doctor_id)

        if not doctor:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Doctor not found",
            )

        radiology = Radiology(
            **data.model_dump()
        )

        db.add(radiology)
        db.commit()
        db.refresh(radiology)

        return radiology

    @staticmethod
    def get(
        db: Session,
        radiology_id: int,
    ) -> Radiology:

        radiology = db.get(
            Radiology,
            radiology_id,
        )

        if not radiology:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Radiology record not found",
            )

        return radiology

    @staticmethod
    def get_by_number(
        db: Session,
        radiology_number: str,
    ) -> Radiology:

        radiology = db.scalar(
            select(Radiology).where(
                Radiology.radiology_number == radiology_number
            )
        )

        if not radiology:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Radiology record not found",
            )

        return radiology

    @staticmethod
    def list(
        db: Session,
        *,
        patient_id: int | None = None,
        doctor_id: int | None = None,
        examination_type: str | None = None,
        body_part: str | None = None,
        priority: str | None = None,
        status_value: str | None = None,
        contrast_used: bool | None = None,
    ) -> list[Radiology]:

        query = select(Radiology).order_by(
            Radiology.id.desc()
        )

        if patient_id is not None:
            query = query.where(
                Radiology.patient_id == patient_id
            )

        if doctor_id is not None:
            query = query.where(
                Radiology.doctor_id == doctor_id
            )

        if examination_type is not None:
            query = query.where(
                Radiology.examination_type == examination_type
            )

        if body_part is not None:
            query = query.where(
                Radiology.body_part == body_part
            )

        if priority is not None:
            query = query.where(
                Radiology.priority == priority
            )

        if status_value is not None:
            query = query.where(
                Radiology.status == status_value
            )

        if contrast_used is not None:
            query = query.where(
                Radiology.contrast_used == contrast_used
            )

        return list(
            db.scalars(query).all()
        )

    @staticmethod
    def update(
        db: Session,
        radiology_id: int,
        data: RadiologyUpdate,
    ) -> Radiology:

        radiology = RadiologyService.get(
            db,
            radiology_id,
        )

        update_data = data.model_dump(
            exclude_unset=True
        )

        if "radiology_number" in update_data:
            existing = db.scalar(
                select(Radiology).where(
                    Radiology.radiology_number
                    == update_data["radiology_number"],
                    Radiology.id != radiology_id,
                )
            )

            if existing:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="Radiology number already exists",
                )

        patient_id = update_data.get(
            "patient_id",
            radiology.patient_id,
        )

        doctor_id = update_data.get(
            "doctor_id",
            radiology.doctor_id,
        )

        if "patient_id" in update_data:
            patient = db.get(
                Patient,
                patient_id,
            )

            if not patient:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Patient not found",
                )

        if "doctor_id" in update_data:
            doctor = db.get(
                Doctor,
                doctor_id,
            )

            if not doctor:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Doctor not found",
                )

        for field, value in update_data.items():
            setattr(
                radiology,
                field,
                value,
            )

        db.commit()
        db.refresh(radiology)

        return radiology

    @staticmethod
    def delete(
        db: Session,
        radiology_id: int,
    ) -> None:

        radiology = RadiologyService.get(
            db,
            radiology_id,
        )

        db.delete(radiology)
        db.commit()
