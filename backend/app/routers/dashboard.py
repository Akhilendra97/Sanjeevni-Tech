from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.dashboard import DashboardHealthResponse, DashboardResponse
from app.services.dashboard_service import dashboard_service

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/overview", response_model=DashboardResponse, summary="Get hospital command-center dashboard")
def get_dashboard_overview(db: Session = Depends(get_db)) -> DashboardResponse:
    try:
        payload = dashboard_service.get_hospital_overview(db)
        return DashboardResponse.model_validate(payload)
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                            detail="Unable to generate hospital dashboard.") from exc


@router.get("/health", response_model=DashboardHealthResponse, summary="Get dashboard health status")
def get_dashboard_health(db: Session = Depends(get_db)) -> DashboardHealthResponse:
    try:
        payload = dashboard_service.get_hospital_overview(db)
        health = payload.get("operational_health", {})
        return DashboardHealthResponse(
            status=health.get("status", "stable"),
            generated_at=payload["generated_at"],
            message=("Hospital dashboard is operating normally."
                     if health.get("status") == "stable"
                     else "Hospital dashboard requires operational attention."),
            metrics={
                "bed_occupancy_percentage": health.get("bed_occupancy_percentage", 0.0),
                "appointment_completion_percentage": health.get("appointment_completion_percentage", 0.0),
                "active_emergency_cases": health.get("active_emergency_cases", 0),
                "critical_triage_cases": health.get("critical_triage_cases", 0),
                "outstanding_balance": health.get("outstanding_balance", 0.0),
                "alert_count": health.get("alert_count", 0),
            },
        )
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                            detail="Unable to determine dashboard health.") from exc
