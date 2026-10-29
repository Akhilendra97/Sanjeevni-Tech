import logging
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.routers import nurses
from app.routers import nurse_workspace
from app.routers import vitals
from app.routers import departments, doctors, hospital_settings
from app.routers import users, hospital_settings
from app.routers import dashboard, hospital_settings
from app.routers import analytics, hospital_settings
from app.routers import audit_logs
from app.routers import staff
from app.routers import staff_duties, staff_self
from app.routers import reports, hospital_settings
from app.routers.auth import router as auth_router
from app.routers.patients import router as patients_router
from app.routers.appointments import router as appointments_router
from app.routers.admissions import router as admissions_router
from app.routers import schedules, hospital_settings
from app.routers import wards, hospital_settings
from app.routers import beds, hospital_settings
from app.routers import prescriptions, hospital_settings
from app.routers import nursing, hospital_settings
from app.routers.billing import router as billing_router
from app.routers.discharge import router as discharge_router
from app.routers.diagnosis import router as diagnosis_router
from app.routers import medical_records, hospital_settings
from app.routers import medicines, hospital_settings
from app.routers import laboratory, hospital_settings
from app.routers import lab_tests, hospital_settings
from app.routers import lab_samples, hospital_settings
from app.routers import lab_reports, hospital_settings
from app.routers import blood_bank, hospital_settings
from app.routers import equipment, hospital_settings
from app.routers import equipment_maintenance, hospital_settings
from app.routers import procurement, hospital_settings
from app.routers import inventory_batch, hospital_settings
from app.routers import pharmacy_dispensing, hospital_settings
from app.routers import stock_receipt, hospital_settings
from app.routers import inventory, hospital_settings
from app.routers import diet, hospital_settings
from app.routers import documents, hospital_settings
from app.routers import emergency, hospital_settings
from app.routers import housekeeping, hospital_settings
from app.routers import icu, hospital_settings
from app.routers import insurance_claim, hospital_settings
from app.routers import invoices, hospital_settings
from app.routers import payments, hospital_settings
from app.routers import leaves, hospital_settings
from app.routers import notifications, hospital_settings
from app.routers import operation_theatre, hospital_settings
from app.routers import surgery, hospital_settings
from app.routers import insurance, hospital_settings
from app.routers import imaging_report, hospital_settings
from app.routers import imaging_study, hospital_settings
from app.routers import radiology, hospital_settings
from app.routers import patient_portal

@asynccontextmanager
async def lifespan(app: FastAPI):
    upload_path = Path(settings.upload_path)
    upload_path.mkdir(parents=True, exist_ok=True)

    yield


app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="Sanjeevni Tech - Smart Hospital Management System API",
    docs_url="/docs" if settings.app_env != "production" else None,
    redoc_url="/redoc" if settings.app_env != "production" else None,
    openapi_url=(
        f"{settings.api_prefix}/openapi.json"
        if settings.app_env != "production"
        else None
    ),
    lifespan=lifespan,
)


# =========================
# API ROUTERS
# =========================

app.include_router(
    auth_router,
    prefix=settings.api_prefix,
)

app.include_router(
    patients_router,
    prefix=settings.api_prefix,
)

app.include_router(
    departments.router,
    prefix=settings.api_prefix,
)

app.include_router(
    doctors.router,
    prefix=settings.api_prefix,
)

app.include_router(
    appointments_router,
    prefix=settings.api_prefix,
)

app.include_router(
    admissions_router,
    prefix=settings.api_prefix,
)

app.include_router(
    schedules.router,
    prefix=settings.api_prefix,
)

app.include_router(
    wards.router,
    prefix=settings.api_prefix,
)

app.include_router(
    beds.router,
    prefix=settings.api_prefix,
)

app.include_router(
    prescriptions.router,
    prefix=settings.api_prefix,
)

app.include_router(
    nursing.router,
    prefix=settings.api_prefix,
)


app.include_router(vitals.router, prefix=settings.api_prefix)
app.include_router(billing_router, prefix=settings.api_prefix)

# Backward-compatible Billing route for existing live clients.
app.include_router(billing_router)

app.include_router(
    discharge_router,
    prefix=settings.api_prefix,
)

app.include_router(
    diagnosis_router,
    prefix=settings.api_prefix,
)

app.include_router(
medical_records.router,
prefix=settings.api_prefix,
)

app.include_router(
medicines.router,
prefix=settings.api_prefix,
)

app.include_router(
laboratory.router,
prefix=settings.api_prefix,
)

app.include_router(
lab_tests.router,
prefix=settings.api_prefix,
)

app.include_router(
lab_samples.router,
prefix=settings.api_prefix,
)

app.include_router(
lab_reports.router,
prefix=settings.api_prefix,
)

app.include_router(
blood_bank.router,
prefix=settings.api_prefix,
)
# =========================
# CORS
# =========================

app.add_middleware(
    CORSMiddleware,
    allow_origins=list(
        dict.fromkeys(
            [
                *settings.cors_origin_list,
                "http://127.0.0.1:5173",
                "http://localhost:5173",
            ]
        )
    ),
    allow_credentials=True,
    allow_methods=[
        "GET",
        "POST",
        "PUT",
        "PATCH",
        "DELETE",
        "OPTIONS",
    ],
    allow_headers=[
        "Authorization",
        "Content-Type",
        "Accept",
        "Origin",
    ],
)


# =========================
# GLOBAL EXCEPTION HANDLER
# =========================

logger = logging.getLogger("sanjeevni.api")

@app.exception_handler(Exception)
async def global_exception_handler(
    request: Request,
    exc: Exception,
) -> JSONResponse:


    logger.exception("Unhandled exception for %s %s", request.method, request.url.path)
    detail = (
        str(exc)
        if settings.debug
        else "Internal server error."
    )

    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "message": detail,
        },
    )


# =========================
# SYSTEM
# =========================

@app.get(
    "/",
    tags=["System"],
)
def root() -> dict[str, str]:
    return {
        "application": settings.app_name,
        "version": settings.app_version,
        "status": "online",
    }


@app.get(
    "/health",
    tags=["System"],
)
def health_check() -> dict[str, str]:
    return {
        "status": "healthy",
        "service": "sanjeevni-tech-api",
    }




app.include_router(
    equipment.router,
    prefix=settings.api_prefix,
)

app.include_router(
    equipment_maintenance.router,
    prefix=settings.api_prefix,
)




# =========================
# PROCUREMENT
# =========================

app.include_router(
    procurement.router,
    prefix=settings.api_prefix,
)
app.include_router(
    stock_receipt.router,
    prefix=settings.api_prefix,
)

app.include_router(
    inventory.router,
    prefix=settings.api_prefix,
)
app.include_router(
    inventory_batch.router,
    prefix=settings.api_prefix,
)
app.include_router(
    pharmacy_dispensing.router,
    prefix=settings.api_prefix,
)


app.include_router(
    diet.router,
    prefix=settings.api_prefix,
)

app.include_router(
    documents.router,
    prefix=settings.api_prefix,
)

app.include_router(
    patient_portal.router,
    prefix=settings.api_prefix,
)

app.include_router(
    emergency.router,
    prefix=settings.api_prefix,
)
app.include_router(
    housekeeping.router,
    prefix=settings.api_prefix,
)
app.include_router(
    icu.router,
    prefix=settings.api_prefix,
)
app.include_router(
    insurance.router,
    prefix=settings.api_prefix,
)
app.include_router(
    insurance_claim.router,
    prefix=settings.api_prefix,
)
app.include_router(
    invoices.router,
    prefix=settings.api_prefix,
)
app.include_router(
    payments.router,
    prefix=settings.api_prefix,
)
app.include_router(
    leaves.router,
    prefix=settings.api_prefix,
)
app.include_router(
    notifications.router,
    prefix=settings.api_prefix,
)
app.include_router(
    radiology.router,
    prefix=settings.api_prefix,
)
app.include_router(
    imaging_study.router,
    prefix=settings.api_prefix,
)
app.include_router(
    imaging_report.router,
    prefix=settings.api_prefix,
)






app.include_router(operation_theatre.router, prefix=settings.api_prefix)
app.include_router(surgery.router, prefix=settings.api_prefix)

from app.routers import triage, hospital_settings

app.include_router(triage.router, prefix=settings.api_prefix)

from app.routers import queue, hospital_settings

app.include_router(queue.router, prefix=settings.api_prefix)

from app.routers import pharmacy, hospital_settings

app.include_router(pharmacy.router, prefix=settings.api_prefix)

from app.routers import parking, hospital_settings

app.include_router(parking.router, prefix=settings.api_prefix)

from app.routers import visitor, hospital_settings

app.include_router(visitor.router, prefix=settings.api_prefix)

from app.routers import nursing_care_plan, hospital_settings
app.include_router(
    nursing_care_plan.router,
    prefix=settings.api_prefix,
)

app.include_router(
    dashboard.router,
    prefix=settings.api_prefix,
)

app.include_router(
    analytics.router,
    prefix=settings.api_prefix,
)
app.include_router(
    reports.router,
    prefix=settings.api_prefix,
)





app.include_router(users.router, prefix=settings.api_prefix)

app.include_router(audit_logs.router, prefix=settings.api_prefix)

app.include_router(staff_self.router, prefix=settings.api_prefix)
app.include_router(staff_duties.router, prefix=settings.api_prefix)
app.include_router(staff.router, prefix=settings.api_prefix)
app.include_router(nurse_workspace.router, prefix=settings.api_prefix)
app.include_router(hospital_settings.router, prefix="/api/v1")

# Nurse router registration
app.include_router(
    nurses.router,
    prefix=settings.api_prefix,
)
