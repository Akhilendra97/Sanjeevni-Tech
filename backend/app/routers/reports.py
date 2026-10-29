from datetime import date

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Query,
    status,
)
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.schemas.reports import ReportResponse
from app.services.report_service import (
    ReportType,
    report_service,
)


router = APIRouter(
    prefix="/reports",
    tags=["Reports"],
)


def _service_error(
    exc: ValueError,
) -> HTTPException:

    message = str(exc)

    if "not found" in message.lower():
        return HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=message,
        )

    return HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail=message,
    )


@router.get(
    "/overview",
    response_model=ReportResponse,
    summary="Generate hospital overview report data",
)
async def overview_report(
    start_date: date | None = Query(
        default=None,
    ),
    end_date: date | None = Query(
        default=None,
    ),
    db: AsyncSession = Depends(
        get_db
    ),
) -> ReportResponse:

    try:
        data = await report_service.get_report(
            db,
            "overview",
            start_date,
            end_date,
        )

        return ReportResponse(
            report_type="overview",
            title=data["title"],
            generated_at=data["generated_at"],
            data=data,
        )

    except ValueError as exc:
        raise _service_error(exc) from exc


@router.get(
    "/patient/{patient_id}",
    response_model=ReportResponse,
    summary="Generate patient clinical summary data",
)
async def patient_report(
    patient_id: int,
    db: AsyncSession = Depends(
        get_db
    ),
) -> ReportResponse:

    try:
        data = await report_service.get_report(
            db,
            "patient",
            patient_id=patient_id,
        )

        return ReportResponse(
            report_type="patient",
            title=data["title"],
            generated_at=data["generated_at"],
            data=data,
        )

    except ValueError as exc:
        raise _service_error(exc) from exc


@router.get(
    "/financial",
    response_model=ReportResponse,
    summary="Generate financial report data",
)
async def financial_report(
    start_date: date | None = Query(
        default=None,
    ),
    end_date: date | None = Query(
        default=None,
    ),
    db: AsyncSession = Depends(
        get_db
    ),
) -> ReportResponse:

    try:
        data = await report_service.get_report(
            db,
            "financial",
            start_date,
            end_date,
        )

        return ReportResponse(
            report_type="financial",
            title=data["title"],
            generated_at=data["generated_at"],
            data=data,
        )

    except ValueError as exc:
        raise _service_error(exc) from exc


@router.get(
    "/operational",
    response_model=ReportResponse,
    summary="Generate operational report data",
)
async def operational_report(
    start_date: date | None = Query(
        default=None,
    ),
    end_date: date | None = Query(
        default=None,
    ),
    db: AsyncSession = Depends(
        get_db
    ),
) -> ReportResponse:

    try:
        data = await report_service.get_report(
            db,
            "operational",
            start_date,
            end_date,
        )

        return ReportResponse(
            report_type="operational",
            title=data["title"],
            generated_at=data["generated_at"],
            data=data,
        )

    except ValueError as exc:
        raise _service_error(exc) from exc


@router.get(
    "/clinical",
    response_model=ReportResponse,
    summary="Generate clinical services report data",
)
async def clinical_report(
    start_date: date | None = Query(
        default=None,
    ),
    end_date: date | None = Query(
        default=None,
    ),
    db: AsyncSession = Depends(
        get_db
    ),
) -> ReportResponse:

    try:
        data = await report_service.get_report(
            db,
            "clinical",
            start_date,
            end_date,
        )

        return ReportResponse(
            report_type="clinical",
            title=data["title"],
            generated_at=data["generated_at"],
            data=data,
        )

    except ValueError as exc:
        raise _service_error(exc) from exc


@router.get(
    "/{report_type}/pdf",
    response_class=FileResponse,
    summary="Generate a hospital report PDF",
)
async def report_pdf(
    report_type: ReportType,
    start_date: date | None = Query(
        default=None,
    ),
    end_date: date | None = Query(
        default=None,
    ),
    patient_id: int | None = Query(
        default=None,
        gt=0,
    ),
    db: AsyncSession = Depends(
        get_db
    ),
) -> FileResponse:

    try:
        data = await report_service.get_report(
            db,
            report_type,
            start_date,
            end_date,
            patient_id,
        )

        output_path = report_service.generate_pdf(
            data
        )

        return FileResponse(
            path=output_path,
            media_type="application/pdf",
            filename=output_path.name,
        )

    except ValueError as exc:
        raise _service_error(exc) from exc
