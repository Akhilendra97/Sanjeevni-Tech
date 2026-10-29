from __future__ import annotations

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.imaging_report import (
    ImagingReportCreate,
    ImagingReportResponse,
    ImagingReportUpdate,
)
from app.services.imaging_report_service import ImagingReportService


router = APIRouter(
    prefix="/imaging-reports",
    tags=["Imaging Report Management"],
)


@router.post(
    "",
    response_model=ImagingReportResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_imaging_report(
    data: ImagingReportCreate,
    db: Session = Depends(get_db),
):
    return ImagingReportService.create(db, data)


@router.get(
    "",
    response_model=list[ImagingReportResponse],
)
def list_imaging_reports(
    study_id: int | None = Query(default=None),
    report_status: str | None = Query(default=None),
    is_final: bool | None = Query(default=None),
    db: Session = Depends(get_db),
):
    return ImagingReportService.list(
        db,
        study_id=study_id,
        report_status=report_status,
        is_final=is_final,
    )


@router.get(
    "/number/{report_number}",
    response_model=ImagingReportResponse,
)
def get_imaging_report_by_number(
    report_number: str,
    db: Session = Depends(get_db),
):
    return ImagingReportService.get_by_number(
        db,
        report_number,
    )


@router.get(
    "/study/{study_id}",
    response_model=ImagingReportResponse,
)
def get_imaging_report_by_study(
    study_id: int,
    db: Session = Depends(get_db),
):
    return ImagingReportService.get_by_study(
        db,
        study_id,
    )


@router.get(
    "/{report_id}",
    response_model=ImagingReportResponse,
)
def get_imaging_report(
    report_id: int,
    db: Session = Depends(get_db),
):
    return ImagingReportService.get(
        db,
        report_id,
    )


@router.put(
    "/{report_id}",
    response_model=ImagingReportResponse,
)
def update_imaging_report(
    report_id: int,
    data: ImagingReportUpdate,
    db: Session = Depends(get_db),
):
    return ImagingReportService.update(
        db,
        report_id,
        data,
    )


@router.patch(
    "/{report_id}/finalize",
    response_model=ImagingReportResponse,
)
def finalize_imaging_report(
    report_id: int,
    db: Session = Depends(get_db),
):
    return ImagingReportService.finalize(
        db,
        report_id,
    )


@router.delete(
    "/{report_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_imaging_report(
    report_id: int,
    db: Session = Depends(get_db),
):
    ImagingReportService.delete(
        db,
        report_id,
    )
    return None
