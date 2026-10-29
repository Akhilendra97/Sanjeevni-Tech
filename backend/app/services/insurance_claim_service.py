from __future__ import annotations

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.admission import Admission
from app.models.insurance import Insurance
from app.models.insurance_claim import InsuranceClaim
from app.models.patient import Patient
from app.schemas.insurance_claim import (
    InsuranceClaimCreate,
    InsuranceClaimUpdate,
)


class InsuranceClaimService:

    @staticmethod
    def _validate_references(
        db: Session,
        insurance_id: int,
        patient_id: int,
        admission_id: int | None = None,
    ) -> None:

        insurance = db.get(
            Insurance,
            insurance_id,
        )

        if not insurance:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Insurance policy not found.",
            )

        patient = db.get(
            Patient,
            patient_id,
        )

        if not patient:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Patient not found.",
            )

        if insurance.patient_id != patient_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Insurance policy does not belong to the selected patient.",
            )

        if admission_id is not None:
            admission = db.get(
                Admission,
                admission_id,
            )

            if not admission:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Admission not found.",
                )

            if admission.patient_id != patient_id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Admission does not belong to the selected patient.",
                )

    @staticmethod
    def create(
        db: Session,
        data: InsuranceClaimCreate,
    ) -> InsuranceClaim:

        existing = db.scalar(
            select(InsuranceClaim).where(
                InsuranceClaim.claim_number == data.claim_number
            )
        )

        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Insurance claim number already exists.",
            )

        if data.approved_amount + data.rejected_amount > data.claim_amount:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Approved amount plus rejected amount cannot exceed claim amount.",
            )

        InsuranceClaimService._validate_references(
            db,
            data.insurance_id,
            data.patient_id,
            data.admission_id,
        )

        claim = InsuranceClaim(
            **data.model_dump(),
        )

        db.add(claim)
        db.commit()
        db.refresh(claim)

        return claim

    @staticmethod
    def get(
        db: Session,
        claim_id: int,
    ) -> InsuranceClaim:

        claim = db.get(
            InsuranceClaim,
            claim_id,
        )

        if not claim:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Insurance claim not found.",
            )

        return claim

    @staticmethod
    def get_by_claim_number(
        db: Session,
        claim_number: str,
    ) -> InsuranceClaim:

        claim = db.scalar(
            select(InsuranceClaim).where(
                InsuranceClaim.claim_number == claim_number
            )
        )

        if not claim:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Insurance claim not found.",
            )

        return claim

    @staticmethod
    def list(
        db: Session,
        insurance_id: int | None = None,
        patient_id: int | None = None,
        admission_id: int | None = None,
        status_value: str | None = None,
    ) -> list[InsuranceClaim]:

        query = select(InsuranceClaim)

        if insurance_id is not None:
            query = query.where(
                InsuranceClaim.insurance_id == insurance_id
            )

        if patient_id is not None:
            query = query.where(
                InsuranceClaim.patient_id == patient_id
            )

        if admission_id is not None:
            query = query.where(
                InsuranceClaim.admission_id == admission_id
            )

        if status_value is not None:
            query = query.where(
                InsuranceClaim.status == status_value
            )

        query = query.order_by(
            InsuranceClaim.claim_date.desc(),
            InsuranceClaim.created_at.desc(),
        )

        return list(db.scalars(query).all())

    @staticmethod
    def update(
        db: Session,
        claim_id: int,
        data: InsuranceClaimUpdate,
    ) -> InsuranceClaim:

        claim = InsuranceClaimService.get(
            db,
            claim_id,
        )

        update_data = data.model_dump(
            exclude_unset=True
        )

        if "claim_number" in update_data:
            existing = db.scalar(
                select(InsuranceClaim).where(
                    InsuranceClaim.claim_number == update_data["claim_number"],
                    InsuranceClaim.id != claim_id,
                )
            )

            if existing:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="Insurance claim number already exists.",
                )

        insurance_id = update_data.get(
            "insurance_id",
            claim.insurance_id,
        )

        patient_id = update_data.get(
            "patient_id",
            claim.patient_id,
        )

        admission_id = update_data.get(
            "admission_id",
            claim.admission_id,
        )

        InsuranceClaimService._validate_references(
            db,
            insurance_id,
            patient_id,
            admission_id,
        )

        claim_amount = update_data.get(
            "claim_amount",
            claim.claim_amount,
        )

        approved_amount = update_data.get(
            "approved_amount",
            claim.approved_amount,
        )

        rejected_amount = update_data.get(
            "rejected_amount",
            claim.rejected_amount,
        )

        if approved_amount + rejected_amount > claim_amount:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Approved amount plus rejected amount cannot exceed claim amount.",
            )

        for field, value in update_data.items():
            setattr(
                claim,
                field,
                value,
            )

        db.commit()
        db.refresh(claim)

        return claim

    @staticmethod
    def delete(
        db: Session,
        claim_id: int,
    ) -> None:

        claim = InsuranceClaimService.get(
            db,
            claim_id,
        )

        db.delete(claim)
        db.commit()
