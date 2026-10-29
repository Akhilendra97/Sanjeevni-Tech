from __future__ import annotations

from datetime import date

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.insurance import Insurance
from app.models.patient import Patient
from app.schemas.insurance import InsuranceCreate, InsuranceUpdate


class InsuranceService:

    @staticmethod
    def create(
        db: Session,
        data: InsuranceCreate,
    ) -> Insurance:
        existing = db.scalar(
            select(Insurance).where(
                Insurance.policy_number == data.policy_number
            )
        )

        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Insurance policy number already exists.",
            )

        patient = db.get(Patient, data.patient_id)

        if not patient:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Patient not found.",
            )

        if data.policy_end_date < data.policy_start_date:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Policy end date cannot be before policy start date.",
            )

        insurance = Insurance(
            **data.model_dump(),
        )

        db.add(insurance)
        db.commit()
        db.refresh(insurance)

        return insurance

    @staticmethod
    def get(
        db: Session,
        insurance_id: int,
    ) -> Insurance:
        insurance = db.get(Insurance, insurance_id)

        if not insurance:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Insurance policy not found.",
            )

        return insurance

    @staticmethod
    def get_by_policy_number(
        db: Session,
        policy_number: str,
    ) -> Insurance:
        insurance = db.scalar(
            select(Insurance).where(
                Insurance.policy_number == policy_number
            )
        )

        if not insurance:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Insurance policy not found.",
            )

        return insurance

    @staticmethod
    def list(
        db: Session,
        patient_id: int | None = None,
        insurance_provider: str | None = None,
        policy_type: str | None = None,
        status_value: str | None = None,
        is_primary: bool | None = None,
    ) -> list[Insurance]:

        query = select(Insurance)

        if patient_id is not None:
            query = query.where(
                Insurance.patient_id == patient_id
            )

        if insurance_provider is not None:
            query = query.where(
                Insurance.insurance_provider == insurance_provider
            )

        if policy_type is not None:
            query = query.where(
                Insurance.policy_type == policy_type
            )

        if status_value is not None:
            query = query.where(
                Insurance.status == status_value
            )

        if is_primary is not None:
            query = query.where(
                Insurance.is_primary == is_primary
            )

        query = query.order_by(
            Insurance.created_at.desc()
        )

        return list(db.scalars(query).all())

    @staticmethod
    def update(
        db: Session,
        insurance_id: int,
        data: InsuranceUpdate,
    ) -> Insurance:

        insurance = InsuranceService.get(
            db,
            insurance_id,
        )

        update_data = data.model_dump(
            exclude_unset=True
        )

        if "policy_number" in update_data:
            existing = db.scalar(
                select(Insurance).where(
                    Insurance.policy_number == update_data["policy_number"],
                    Insurance.id != insurance_id,
                )
            )

            if existing:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="Insurance policy number already exists.",
                )

        if "patient_id" in update_data:
            patient = db.get(
                Patient,
                update_data["patient_id"],
            )

            if not patient:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Patient not found.",
                )

        start_date = update_data.get(
            "policy_start_date",
            insurance.policy_start_date,
        )

        end_date = update_data.get(
            "policy_end_date",
            insurance.policy_end_date,
        )

        if end_date < start_date:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Policy end date cannot be before policy start date.",
            )

        for field, value in update_data.items():
            setattr(
                insurance,
                field,
                value,
            )

        db.commit()
        db.refresh(insurance)

        return insurance

    @staticmethod
    def delete(
        db: Session,
        insurance_id: int,
    ) -> None:

        insurance = InsuranceService.get(
            db,
            insurance_id,
        )

        db.delete(insurance)
        db.commit()
