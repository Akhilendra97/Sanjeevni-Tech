from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.admission import Admission
from app.models.appointment import Appointment
from app.models.bed import Bed
from app.models.billing import Billing
from app.models.doctor import Doctor
from app.models.department import Department
from app.models.ward import Ward
from app.models.diagnosis import Diagnosis
from app.models.emergency import Emergency
from app.models.invoice import Invoice
from app.models.lab_test import LabTest
from app.models.nurse import Nurse
from app.models.patient import Patient
from app.models.payment import Payment
from app.models.prescription import Prescription
from app.models.radiology import Radiology
from app.models.staff import Staff
from app.models.surgery import Surgery
from app.models.triage import Triage


class AnalyticsService:
    """
    Hospital analytics engine.

    Produces aggregated and trend-oriented data for dashboards,
    management reports and Recharts-based frontend visualizations.
    """

    @staticmethod
    async def _count(
        db: Session,
        model: Any,
    ) -> int:
        result = db.execute(
            select(func.count()).select_from(model)
        )
        return int(result.scalar_one() or 0)

    @staticmethod
    async def _count_where(
        db: Session,
        model: Any,
        column_name: str,
        value: Any,
    ) -> int:
        column = getattr(model, column_name, None)

        if column is None:
            return 0

        criterion = (
            func.lower(column) == str(value).lower()
            if isinstance(value, str)
            else column == value
        )
        result = db.execute(
            select(func.count())
            .select_from(model)
            .where(criterion)
        )

        return int(result.scalar_one() or 0)

    @staticmethod
    async def _sum(
        db: Session,
        model: Any,
        column_name: str,
    ) -> float:
        column = getattr(model, column_name, None)

        if column is None:
            return 0.0

        result = db.execute(
            select(func.coalesce(func.sum(column), 0))
            .select_from(model)
        )

        return float(result.scalar_one() or 0)

    @staticmethod
    async def _daily_series(
        db: Session,
        model: Any,
        date_column_name: str,
        days: int = 7,
    ) -> list[dict[str, Any]]:
        """
        Generate a daily time-series dataset.

        The result is directly usable by Recharts.
        """

        column = getattr(model, date_column_name, None)

        if column is None:
            return []

        today = datetime.now(timezone.utc).date()
        start_date = today - timedelta(days=days - 1)

        result = db.execute(
            select(
                func.date(column).label("date"),
                func.count().label("count"),
            )
            .select_from(model)
            .where(
                func.date(column) >= start_date,
                func.date(column) <= today,
            )
            .group_by(func.date(column))
            .order_by(func.date(column))
        )

        rows = result.all()

        existing = {
            str(row.date): int(row.count)
            for row in rows
        }

        series: list[dict[str, Any]] = []

        for offset in range(days):
            current_date = start_date + timedelta(
                days=offset
            )

            date_key = str(current_date)

            series.append(
                {
                    "date": date_key,
                    "value": existing.get(
                        date_key,
                        0,
                    ),
                }
            )

        return series

    @staticmethod
    async def _group_distribution(
        db: Session,
        model: Any,
        column_name: str,
    ) -> list[dict[str, Any]]:
        """
        Return grouped distribution data suitable for pie,
        donut or bar charts.
        """

        column = getattr(model, column_name, None)

        if column is None:
            return []

        result = db.execute(
            select(
                column.label("label"),
                func.count().label("value"),
            )
            .select_from(model)
            .group_by(column)
            .order_by(func.count().desc())
        )

        return [
            {
                "label": str(row.label)
                if row.label is not None
                else "Unknown",
                "value": int(row.value),
            }
            for row in result.all()
        ]

    @classmethod
    async def get_patient_analytics(
        cls,
        db: Session,
    ) -> dict[str, Any]:
        total = await cls._count(db, Patient)

        registrations = await cls._daily_series(
            db,
            Patient,
            "created_at",
            7,
        )

        gender_distribution = await cls._group_distribution(
            db,
            Patient,
            "gender",
        )

        blood_group_distribution = (
            await cls._group_distribution(
                db,
                Patient,
                "blood_group",
            )
        )

        return {
            "total_patients": total,
            "registration_trend": registrations,
            "gender_distribution": gender_distribution,
            "blood_group_distribution": (
                blood_group_distribution
            ),
        }

    @classmethod
    async def get_appointment_analytics(
        cls,
        db: Session,
    ) -> dict[str, Any]:
        total = await cls._count(
            db,
            Appointment,
        )

        return {
            "total_appointments": total,
            "status_distribution": (
                await cls._group_distribution(
                    db,
                    Appointment,
                    "status",
                )
            ),
            "appointment_trend": (
                await cls._daily_series(
                    db,
                    Appointment,
                    "appointment_date",
                    7,
                )
            ),
        }

    @classmethod
    async def get_admission_analytics(
        cls,
        db: Session,
    ) -> dict[str, Any]:
        total = await cls._count(
            db,
            Admission,
        )

        return {
            "total_admissions": total,
            "status_distribution": (
                await cls._group_distribution(
                    db,
                    Admission,
                    "status",
                )
            ),
            "admission_trend": (
                await cls._daily_series(
                    db,
                    Admission,
                    "admission_date",
                    7,
                )
            ),
        }

    @classmethod
    async def get_bed_analytics(
        cls,
        db: Session,
    ) -> dict[str, Any]:
        total = await cls._count(db, Bed)

        status_distribution = (
            await cls._group_distribution(
                db,
                Bed,
                "status",
            )
        )

        occupied = await cls._count_where(
            db,
            Bed,
            "status",
            "occupied",
        )

        return {
            "total_beds": total,
            "occupied_beds": occupied,
            "occupancy_percentage": (
                round(
                    (occupied / total) * 100,
                    2,
                )
                if total
                else 0.0
            ),
            "status_distribution": status_distribution,
        }

    @classmethod
    async def get_emergency_analytics(
        cls,
        db: Session,
    ) -> dict[str, Any]:
        total = await cls._count(
            db,
            Emergency,
        )

        return {
            "total_emergencies": total,
            "status_distribution": (
                await cls._group_distribution(
                    db,
                    Emergency,
                    "status",
                )
            ),
            "triage_distribution": (
                await cls._group_distribution(
                    db,
                    Triage,
                    "triage_level",
                )
            ),
            "emergency_trend": (
                await cls._daily_series(
                    db,
                    Emergency,
                    "arrival_time",
                    7,
                )
            ),
        }

    @classmethod
    async def get_surgery_analytics(
        cls,
        db: Session,
    ) -> dict[str, Any]:
        total = await cls._count(
            db,
            Surgery,
        )

        return {
            "total_surgeries": total,
            "status_distribution": (
                await cls._group_distribution(
                    db,
                    Surgery,
                    "status",
                )
            ),
            "surgery_type_distribution": (
                await cls._group_distribution(
                    db,
                    Surgery,
                    "surgery_type",
                )
            ),
            "surgery_trend": (
                await cls._daily_series(
                    db,
                    Surgery,
                    "scheduled_start",
                    7,
                )
            ),
        }

    @classmethod
    async def get_clinical_analytics(
        cls,
        db: Session,
    ) -> dict[str, Any]:
        prescriptions = await cls._count(
            db,
            Prescription,
        )

        diagnoses = await cls._count(
            db,
            Diagnosis,
        )

        lab_tests = await cls._count(
            db,
            LabTest,
        )

        radiology = await cls._count(
            db,
            Radiology,
        )

        return {
            "prescriptions": prescriptions,
            "diagnoses": diagnoses,
            "laboratory_tests": lab_tests,
            "radiology_records": radiology,
            "prescription_trend": (
                await cls._daily_series(
                    db,
                    Prescription,
                    "prescription_date",
                    7,
                )
            ),
            "radiology_trend": (
                await cls._daily_series(
                    db,
                    Radiology,
                    "requested_at",
                    7,
                )
            ),
        }

    @classmethod
    async def get_financial_analytics(
        cls,
        db: Session,
    ) -> dict[str, Any]:
        invoice_total = await cls._sum(
            db,
            Invoice,
            "total_amount",
        )

        paid_amount = await cls._sum(
            db,
            Invoice,
            "paid_amount",
        )

        outstanding = await cls._sum(
            db,
            Invoice,
            "balance_amount",
        )

        payment_collection = await cls._sum(
            db,
            Payment,
            "amount",
        )

        billing_total = await cls._sum(
            db,
            Billing,
            "total_amount",
        )

        return {
            "invoice_total": round(
                invoice_total,
                2,
            ),
            "paid_amount": round(
                paid_amount,
                2,
            ),
            "outstanding_balance": round(
                outstanding,
                2,
            ),
            "payment_collection": round(
                payment_collection,
                2,
            ),
            "billing_total": round(
                billing_total,
                2,
            ),
            "invoice_status_distribution": (
                await cls._group_distribution(
                    db,
                    Invoice,
                    "status",
                )
            ),
            "payment_status_distribution": (
                await cls._group_distribution(
                    db,
                    Payment,
                    "status",
                )
            ),
            "payment_trend": (
                await cls._daily_series(
                    db,
                    Payment,
                    "payment_date",
                    7,
                )
            ),
        }

    @classmethod
    async def get_staff_analytics(
        cls,
        db: Session,
    ) -> dict[str, Any]:
        doctors = await cls._count(
            db,
            Doctor,
        )

        nurses = await cls._count(
            db,
            Nurse,
        )

        staff = await cls._count(
            db,
            Staff,
        )

        return {
            "doctors": doctors,
            "nurses": nurses,
            "staff": staff,
            "total_clinical_staff": (
                doctors + nurses + staff
            ),
        }

    @classmethod
    async def get_complete_analytics(
        cls,
        db: Session,
    ) -> dict[str, Any]:
        """
        Complete analytics payload for the management
        dashboard and charting layer.
        """

        generated_at = datetime.now(
            timezone.utc
        ).isoformat()

        return {
            "generated_at": generated_at,
            "patients": await cls.get_patient_analytics(
                db
            ),
            "appointments": await cls.get_appointment_analytics(
                db
            ),
            "admissions": await cls.get_admission_analytics(
                db
            ),
            "beds": await cls.get_bed_analytics(
                db
            ),
            "emergency": await cls.get_emergency_analytics(
                db
            ),
            "surgeries": await cls.get_surgery_analytics(
                db
            ),
            "clinical": await cls.get_clinical_analytics(
                db
            ),
            "financial": await cls.get_financial_analytics(
                db
            ),
            "staff": await cls.get_staff_analytics(
                db
            ),
            "departments": {
                "total_departments": await cls._count(db, Department),
            },
            "wards": {
                "total_wards": await cls._count(db, Ward),
            },
        }


analytics_service = AnalyticsService()

