from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.analytics import AnalyticsResponse
from app.services.analytics_service import analytics_service


router = APIRouter(
    prefix="/analytics",
    tags=["Analytics"],
)


@router.get(
    "/overview",
    response_model=AnalyticsResponse,
    summary="Get hospital analytics overview",
    description=(
        "Returns aggregated hospital analytics including "
        "patient, appointment, admission, bed, emergency, "
        "surgery, clinical, financial and staff analytics."
    ),
)
async def get_analytics_overview(
    db: Session = Depends(get_db),
) -> AnalyticsResponse:
    try:
        analytics_data = (
            await analytics_service.get_complete_analytics(
                db
            )
        )

        return AnalyticsResponse.model_validate(
            analytics_data
        )

    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to generate hospital analytics.",
        ) from exc


@router.get(
    "/health",
    summary="Get analytics health status",
    description=(
        "Returns a lightweight health response for "
        "the analytics engine."
    ),
)
async def get_analytics_health(
    db: Session = Depends(get_db),
) -> dict[str, object]:
    try:
        analytics_data = (
            await analytics_service.get_complete_analytics(
                db
            )
        )

        return {
            "status": "healthy",
            "generated_at": analytics_data[
                "generated_at"
            ],
            "service": "hospital-analytics",
            "modules": [
                "patients",
                "appointments",
                "admissions",
                "beds",
                "emergency",
                "surgeries",
                "clinical",
                "financial",
                "staff",
            ],
        }

    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Analytics service is unavailable.",
        ) from exc
