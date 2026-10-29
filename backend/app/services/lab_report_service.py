from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.lab_report import LabReport
from app.schemas.lab_report import (
    LabReportCreate,
    LabReportUpdate,
)


def create_lab_report(
    db: Session,
    data: LabReportCreate,
) -> LabReport:
    existing = db.scalar(
        select(LabReport).where(
            LabReport.report_number
            == data.report_number
        )
    )

    if existing:
        raise ValueError(
            "A laboratory report with this number already exists."
        )

    report = LabReport(**data.model_dump())

    db.add(report)
    db.commit()
    db.refresh(report)

    return report


def get_lab_report_by_id(
    db: Session,
    report_id: int,
) -> LabReport | None:
    return db.get(LabReport, report_id)


def list_lab_reports(
    db: Session,
) -> list[LabReport]:
    statement = select(LabReport).order_by(
        LabReport.id.desc()
    )

    return list(
        db.scalars(statement).all()
    )


def update_lab_report(
    db: Session,
    report: LabReport,
    data: LabReportUpdate,
) -> LabReport:
    updates = data.model_dump(
        exclude_unset=True,
    )

    if "report_number" in updates:
        existing = db.scalar(
            select(LabReport).where(
                LabReport.report_number
                == updates["report_number"],
                LabReport.id != report.id,
            )
        )

        if existing:
            raise ValueError(
                "A laboratory report with this number already exists."
            )

    for field, value in updates.items():
        setattr(report, field, value)

    db.commit()
    db.refresh(report)

    return report


def delete_lab_report(
    db: Session,
    report: LabReport,
) -> None:
    db.delete(report)
    db.commit()