from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.models.imaging_study import ImagingStudy
from app.models.radiology import Radiology
from app.schemas.imaging_study import (
    ImagingStudyCreate,
    ImagingStudyUpdate,
)


class ImagingStudyService:

    @staticmethod
    def create(
        db: Session,
        data: ImagingStudyCreate,
    ) -> ImagingStudy:

        existing = db.scalar(
            select(ImagingStudy).where(
                ImagingStudy.study_number == data.study_number
            )
        )

        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Study number already exists",
            )

        radiology = db.get(
            Radiology,
            data.radiology_id,
        )

        if not radiology:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Radiology record not found",
            )

        if data.image_count < 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Image count cannot be negative",
            )

        if data.is_completed and data.completion_date is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Completion date is required for a completed study",
            )

        study = ImagingStudy(
            **data.model_dump()
        )

        db.add(study)
        db.commit()
        db.refresh(study)

        return study

    @staticmethod
    def get(
        db: Session,
        study_id: int,
    ) -> ImagingStudy:

        study = db.get(
            ImagingStudy,
            study_id,
        )

        if not study:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Imaging study not found",
            )

        return study

    @staticmethod
    def get_by_number(
        db: Session,
        study_number: str,
    ) -> ImagingStudy:

        study = db.scalar(
            select(ImagingStudy).where(
                ImagingStudy.study_number == study_number
            )
        )

        if not study:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Imaging study not found",
            )

        return study

    @staticmethod
    def list(
        db: Session,
        *,
        radiology_id: int | None = None,
        modality: str | None = None,
        body_part: str | None = None,
        is_completed: bool | None = None,
    ) -> list[ImagingStudy]:

        query = select(ImagingStudy).order_by(
            ImagingStudy.id.desc()
        )

        if radiology_id is not None:
            query = query.where(
                ImagingStudy.radiology_id == radiology_id
            )

        if modality is not None:
            query = query.where(
                ImagingStudy.modality == modality
            )

        if body_part is not None:
            query = query.where(
                ImagingStudy.body_part == body_part
            )

        if is_completed is not None:
            query = query.where(
                ImagingStudy.is_completed == is_completed
            )

        return list(
            db.scalars(query).all()
        )

    @staticmethod
    def update(
        db: Session,
        study_id: int,
        data: ImagingStudyUpdate,
    ) -> ImagingStudy:

        study = ImagingStudyService.get(
            db,
            study_id,
        )

        update_data = data.model_dump(
            exclude_unset=True
        )

        if "study_number" in update_data:
            existing = db.scalar(
                select(ImagingStudy).where(
                    ImagingStudy.study_number
                    == update_data["study_number"],
                    ImagingStudy.id != study_id,
                )
            )

            if existing:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="Study number already exists",
                )

        if "radiology_id" in update_data:
            radiology = db.get(
                Radiology,
                update_data["radiology_id"],
            )

            if not radiology:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Radiology record not found",
                )

        if "image_count" in update_data:
            if update_data["image_count"] < 0:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Image count cannot be negative",
                )

        final_is_completed = update_data.get(
            "is_completed",
            study.is_completed,
        )

        final_completion_date = update_data.get(
            "completion_date",
            study.completion_date,
        )

        if final_is_completed and final_completion_date is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Completion date is required for a completed study",
            )

        for field, value in update_data.items():
            setattr(
                study,
                field,
                value,
            )

        db.commit()
        db.refresh(study)

        return study

    @staticmethod
    def delete(
        db: Session,
        study_id: int,
    ) -> None:

        study = ImagingStudyService.get(
            db,
            study_id,
        )

        db.delete(study)
        db.commit()
