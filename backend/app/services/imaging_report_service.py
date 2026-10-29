from __future__ import annotations

from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.imaging_report import ImagingReport
from app.models.imaging_study import ImagingStudy
from app.schemas.imaging_report import (
    ImagingReportCreate,
    ImagingReportUpdate,
)


class ImagingReportService:

    @staticmethod
    def create(
        db: Session,
        data: ImagingReportCreate,
    ) -> ImagingReport:

        existing_number = db.scalar(
            select(ImagingReport).where(
                ImagingReport.report_number == data.report_number
            )
        )

        if existing_number:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Report number already exists",
            )

        study = db.get(
            ImagingStudy,
            data.study_id,
        )

        if not study:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Imaging study not found",
            )

        existing_report = db.scalar(
            select(ImagingReport).where(
                ImagingReport.study_id == data.study_id
            )
        )

        if existing_report:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="A report already exists for this imaging study",
            )

        if data.is_final and not data.findings and not data.impression:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Final report requires findings or impression",
            )

        report_data = data.model_dump()

        if data.is_final:
            report_data["reported_at"] = (
                data.reported_at
                or datetime.now(timezone.utc)
            )
            report_data["report_status"] = "final"

        report = ImagingReport(
            **report_data
        )

        db.add(report)
        db.commit()
        db.refresh(report)

        return report

    @staticmethod
    def get(
        db: Session,
        report_id: int,
    ) -> ImagingReport:

        report = db.get(
            ImagingReport,
            report_id,
        )

        if not report:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Imaging report not found",
            )

        return report

    @staticmethod
    def get_by_number(
        db: Session,
        report_number: str,
    ) -> ImagingReport:

        report = db.scalar(
            select(ImagingReport).where(
                ImagingReport.report_number == report_number
            )
        )

        if not report:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Imaging report not found",
            )

        return report

    @staticmethod
    def get_by_study(
        db: Session,
        study_id: int,
    ) -> ImagingReport | None:

        return db.scalar(
            select(ImagingReport).where(
                ImagingReport.study_id == study_id
            )
        )

    @staticmethod
    def list(
        db: Session,
        *,
        study_id: int | None = None,
        report_status: str | None = None,
        is_final: bool | None = None,
    ) -> list[ImagingReport]:

        query = select(ImagingReport).order_by(
            ImagingReport.id.desc()
        )

        if study_id is not None:
            query = query.where(
                ImagingReport.study_id == study_id
            )

        if report_status is not None:
            query = query.where(
                ImagingReport.report_status == report_status
            )

        if is_final is not None:
            query = query.where(
                ImagingReport.is_final == is_final
            )

        return list(
            db.scalars(query).all()
        )

    @staticmethod
    def update(
        db: Session,
        report_id: int,
        data: ImagingReportUpdate,
    ) -> ImagingReport:

        report = ImagingReportService.get(
            db,
            report_id,
        )

        if report.is_final:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Final imaging report cannot be modified",
            )

        update_data = data.model_dump(
            exclude_unset=True
        )

        if "report_number" in update_data:
            existing = db.scalar(
                select(ImagingReport).where(
                    ImagingReport.report_number
                    == update_data["report_number"],
                    ImagingReport.id != report_id,
                )
            )

            if existing:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="Report number already exists",
                )

        if "study_id" in update_data:
            study = db.get(
                ImagingStudy,
                update_data["study_id"],
            )

            if not study:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Imaging study not found",
                )

            existing_report = db.scalar(
                select(ImagingReport).where(
                    ImagingReport.study_id
                    == update_data["study_id"],
                    ImagingReport.id != report_id,
                )
            )

            if existing_report:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="A report already exists for this imaging study",
                )

        final_value = update_data.get(
            "is_final",
            report.is_final,
        )

        final_findings = update_data.get(
            "findings",
            report.findings,
        )

        final_impression = update_data.get(
            "impression",
            report.impression,
        )

        if final_value and not final_findings and not final_impression:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Final report requires findings or impression",
            )

        if final_value:
            update_data["is_final"] = True
            update_data["report_status"] = "final"
            update_data["reported_at"] = (
                update_data.get("reported_at")
                or datetime.now(timezone.utc)
            )

        for field, value in update_data.items():
            setattr(
                report,
                field,
                value,
            )

        db.commit()
        db.refresh(report)

        return report

    @staticmethod
    def finalize(
        db: Session,
        report_id: int,
    ) -> ImagingReport:

        report = ImagingReportService.get(
            db,
            report_id,
        )

        if report.is_final:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Imaging report is already final",
            )

        if not report.findings and not report.impression:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Final report requires findings or impression",
            )

        report.is_final = True
        report.report_status = "final"
        report.reported_at = (
            report.reported_at
            or datetime.now(timezone.utc)
        )

        db.commit()
        db.refresh(report)

        return report

    @staticmethod
    def delete(
        db: Session,
        report_id: int,
    ) -> None:

        report = ImagingReportService.get(
            db,
            report_id,
        )

        if report.is_final:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Final imaging report cannot be deleted",
            )

        db.delete(report)
        db.commit()
