from __future__ import annotations

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.imaging_study import (
    ImagingStudyCreate,
    ImagingStudyResponse,
    ImagingStudyUpdate,
)
from app.services.imaging_study_service import ImagingStudyService


router = APIRouter(
    prefix="/imaging-studies",
    tags=["Imaging Study Management"],
)


@router.post(
    "",
    response_model=ImagingStudyResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_imaging_study(
    data: ImagingStudyCreate,
    db: Session = Depends(get_db),
):
    return ImagingStudyService.create(db, data)


@router.get(
    "",
    response_model=list[ImagingStudyResponse],
)
def list_imaging_studies(
    radiology_id: int | None = Query(default=None),
    modality: str | None = Query(default=None),
    body_part: str | None = Query(default=None),
    is_completed: bool | None = Query(default=None),
    db: Session = Depends(get_db),
):
    return ImagingStudyService.list(
        db,
        radiology_id=radiology_id,
        modality=modality,
        body_part=body_part,
        is_completed=is_completed,
    )


@router.get(
    "/number/{study_number}",
    response_model=ImagingStudyResponse,
)
def get_imaging_study_by_number(
    study_number: str,
    db: Session = Depends(get_db),
):
    return ImagingStudyService.get_by_number(
        db,
        study_number,
    )


@router.get(
    "/{study_id}",
    response_model=ImagingStudyResponse,
)
def get_imaging_study(
    study_id: int,
    db: Session = Depends(get_db),
):
    return ImagingStudyService.get(
        db,
        study_id,
    )


@router.put(
    "/{study_id}",
    response_model=ImagingStudyResponse,
)
def update_imaging_study(
    study_id: int,
    data: ImagingStudyUpdate,
    db: Session = Depends(get_db),
):
    return ImagingStudyService.update(
        db,
        study_id,
        data,
    )


@router.delete(
    "/{study_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_imaging_study(
    study_id: int,
    db: Session = Depends(get_db),
):
    ImagingStudyService.delete(
        db,
        study_id,
    )
    return None
