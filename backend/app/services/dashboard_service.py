from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.admission import Admission
from app.models.appointment import Appointment
from app.models.bed import Bed
from app.models.billing import Billing
from app.models.blood_unit import BloodUnit
from app.models.department import Department
from app.models.doctor import Doctor
from app.models.emergency import Emergency
from app.models.inventory import Inventory
from app.models.invoice import Invoice
from app.models.lab_test import LabTest
from app.models.nurse import Nurse
from app.models.operation_theatre import OperationTheatre
from app.models.patient import Patient
from app.models.payment import Payment
from app.models.pharmacy import Pharmacy
from app.models.prescription import Prescription
from app.models.radiology import Radiology
from app.models.staff import Staff
from app.models.surgery import Surgery
from app.models.triage import Triage
from app.models.ward import Ward


class DashboardService:
    """
    Premium hospital command-center service.

    The service intentionally keeps dashboard aggregation in one layer so
    the future frontend can consume a stable, structured payload without
    embedding database logic inside the router.
    """

    @staticmethod
    def _count(
        db: Session,
        model: Any,
    ) -> int:
        result = db.execute(
            select(func.count()).select_from(model)
        )
        return int(result.scalar_one() or 0)

    @staticmethod
    def _count_where(
        db: Session,
        model: Any,
        column_name: str,
        value: Any,
    ) -> int:
        column = getattr(model, column_name, None)

        if column is None:
            return 0

        result = db.execute(
            select(func.count())
            .select_from(model)
            .where(column == value)
        )

        return int(result.scalar_one() or 0)

    @staticmethod
    def _sum(
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
    def _count_today(
        db: Session,
        model: Any,
        column_name: str,
    ) -> int:
        column = getattr(model, column_name, None)

        if column is None:
            return 0

        today = datetime.now(timezone.utc).date()

        result = db.execute(
            select(func.count())
            .select_from(model)
            .where(func.date(column) == today)
        )

        return int(result.scalar_one() or 0)

    @staticmethod
    def _percentage(
        numerator: int | float,
        denominator: int | float,
    ) -> float:
        if denominator <= 0:
            return 0.0

        return round(
            (float(numerator) / float(denominator)) * 100,
            2,
        )

    @classmethod
    def get_hospital_overview(
        cls,
        db: Session,
    ) -> dict[str, Any]:
        """
        Generate the complete hospital command-center overview.
        """

        patients = cls._count(db, Patient)
        doctors = cls._count(db, Doctor)
        nurses = cls._count(db, Nurse)
        staff = cls._count(db, Staff)
        departments = cls._count(db, Department)
        wards = cls._count(db, Ward)

        beds = cls._count(db, Bed)
        occupied_beds = cls._count_where(
            db,
            Bed,
            "status",
            "occupied",
        )
        available_beds = cls._count_where(
            db,
            Bed,
            "status",
            "available",
        )
        reserved_beds = cls._count_where(
            db,
            Bed,
            "status",
            "reserved",
        )
        maintenance_beds = cls._count_where(
            db,
            Bed,
            "status",
            "maintenance",
        )

        appointments = cls._count(db, Appointment)
        today_appointments = cls._count_today(
            db,
            Appointment,
            "appointment_date",
        )
        scheduled_appointments = cls._count_where(
            db,
            Appointment,
            "status",
            "scheduled",
        )
        confirmed_appointments = cls._count_where(
            db,
            Appointment,
            "status",
            "confirmed",
        )
        completed_appointments = cls._count_where(
            db,
            Appointment,
            "status",
            "completed",
        )
        cancelled_appointments = cls._count_where(
            db,
            Appointment,
            "status",
            "cancelled",
        )

        admissions = cls._count(db, Admission)
        active_admissions = cls._count_where(
            db,
            Admission,
            "status",
            "admitted",
        )
        discharged_admissions = cls._count_where(
            db,
            Admission,
            "status",
            "discharged",
        )

        emergencies = cls._count(db, Emergency)
        active_emergencies = cls._count_where(
            db,
            Emergency,
            "status",
            "active",
        )
        emergency_today = cls._count_today(
            db,
            Emergency,
            "arrival_time",
        )

        triage_records = cls._count(db, Triage)
        critical_triage = cls._count_where(
            db,
            Triage,
            "triage_level",
            "resuscitation",
        )
        emergency_triage = cls._count_where(
            db,
            Triage,
            "triage_level",
            "emergency",
        )
        urgent_triage = cls._count_where(
            db,
            Triage,
            "triage_level",
            "urgent",
        )

        surgeries = cls._count(db, Surgery)
        scheduled_surgeries = cls._count_where(
            db,
            Surgery,
            "status",
            "scheduled",
        )
        completed_surgeries = cls._count_where(
            db,
            Surgery,
            "status",
            "completed",
        )
        cancelled_surgeries = cls._count_where(
            db,
            Surgery,
            "status",
            "cancelled",
        )

        operation_theatres = cls._count(
            db,
            OperationTheatre,
        )
        active_theatres = cls._count_where(
            db,
            OperationTheatre,
            "status",
            "in_progress",
        )

        prescriptions = cls._count(db, Prescription)
        today_prescriptions = cls._count_today(
            db,
            Prescription,
            "prescription_date",
        )

        lab_tests = cls._count(db, LabTest)
        radiology_records = cls._count(
            db,
            Radiology,
        )

        inventory_items = cls._count(
            db,
            Inventory,
        )
        low_stock_items = 0

        inventory_status_column = getattr(
            Inventory,
            "status",
            None,
        )

        if inventory_status_column is not None:
            low_stock_items = cls._count_where(
                db,
                Inventory,
                "status",
                "low_stock",
            )

        pharmacies = cls._count(db, Pharmacy)

        blood_units = cls._count(
            db,
            BloodUnit,
        )
        available_blood_units = cls._count_where(
            db,
            BloodUnit,
            "status",
            "available",
        )
        reserved_blood_units = cls._count_where(
            db,
            BloodUnit,
            "status",
            "reserved",
        )

        invoices = cls._count(db, Invoice)
        unpaid_invoices = cls._count_where(
            db,
            Invoice,
            "status",
            "unpaid",
        )
        paid_invoices = cls._count_where(
            db,
            Invoice,
            "status",
            "paid",
        )

        invoice_total = cls._sum(
            db,
            Invoice,
            "total",
        )
        invoice_paid = cls._sum(
            db,
            Invoice,
            "paid",
        )
        invoice_balance = cls._sum(
            db,
            Invoice,
            "balance",
        )

        payments = cls._count(db, Payment)
        completed_payments = cls._count_where(
            db,
            Payment,
            "status",
            "completed",
        )
        payment_collection = cls._sum(
            db,
            Payment,
            "amount",
        )

        billing_records = cls._count(
            db,
            Billing,
        )
        billing_total = cls._sum(
            db,
            Billing,
            "total_amount",
        )

        bed_occupancy = cls._percentage(
            occupied_beds,
            beds,
        )

        appointment_completion = cls._percentage(
            completed_appointments,
            appointments,
        )

        admission_utilization = cls._percentage(
            active_admissions,
            patients,
        )

        alerts: list[dict[str, Any]] = []

        if bed_occupancy >= 90:
            alerts.append(
                {
                    "type": "capacity",
                    "severity": "critical",
                    "title": "Bed capacity critical",
                    "message": (
                        f"Bed occupancy has reached "
                        f"{bed_occupancy}%."
                    ),
                }
            )
        elif bed_occupancy >= 80:
            alerts.append(
                {
                    "type": "capacity",
                    "severity": "warning",
                    "title": "High bed occupancy",
                    "message": (
                        f"Bed occupancy is currently "
                        f"{bed_occupancy}%."
                    ),
                }
            )

        if active_emergencies >= 10:
            alerts.append(
                {
                    "type": "emergency",
                    "severity": "critical",
                    "title": "Emergency pressure elevated",
                    "message": (
                        f"{active_emergencies} emergency cases "
                        "are currently active."
                    ),
                }
            )

        if critical_triage > 0:
            alerts.append(
                {
                    "type": "triage",
                    "severity": "critical",
                    "title": "Critical triage cases",
                    "message": (
                        f"{critical_triage} resuscitation-level "
                        "triage record(s) detected."
                    ),
                }
            )

        if available_beds == 0 and beds > 0:
            alerts.append(
                {
                    "type": "capacity",
                    "severity": "critical",
                    "title": "No available beds",
                    "message": (
                        "No currently available beds were found."
                    ),
                }
            )

        if invoice_balance > 0:
            alerts.append(
                {
                    "type": "finance",
                    "severity": "info",
                    "title": "Outstanding patient balance",
                    "message": (
                        f"Outstanding invoice balance: "
                        f"{invoice_balance:.2f}."
                    ),
                }
            )

        return {
            "generated_at": datetime.now(
                timezone.utc
            ).isoformat(),

            "hospital": {
                "patients": patients,
                "doctors": doctors,
                "nurses": nurses,
                "staff": staff,
                "departments": departments,
                "wards": wards,
            },

            "capacity": {
                "total_beds": beds,
                "occupied_beds": occupied_beds,
                "available_beds": available_beds,
                "reserved_beds": reserved_beds,
                "maintenance_beds": maintenance_beds,
                "occupancy_percentage": bed_occupancy,
            },

            "patient_flow": {
                "total_admissions": admissions,
                "active_admissions": active_admissions,
                "discharged_admissions": discharged_admissions,
                "patient_to_admission_percentage": (
                    admission_utilization
                ),
            },

            "appointments": {
                "total": appointments,
                "today": today_appointments,
                "scheduled": scheduled_appointments,
                "confirmed": confirmed_appointments,
                "completed": completed_appointments,
                "cancelled": cancelled_appointments,
                "completion_percentage": appointment_completion,
            },

            "emergency": {
                "total_cases": emergencies,
                "active_cases": active_emergencies,
                "today_cases": emergency_today,
                "triage_records": triage_records,
                "critical_triage": critical_triage,
                "emergency_triage": emergency_triage,
                "urgent_triage": urgent_triage,
            },

            "surgical_services": {
                "total_surgeries": surgeries,
                "scheduled": scheduled_surgeries,
                "completed": completed_surgeries,
                "cancelled": cancelled_surgeries,
                "operation_theatres": operation_theatres,
                "active_theatres": active_theatres,
            },

            "clinical_services": {
                "prescriptions": prescriptions,
                "today_prescriptions": today_prescriptions,
                "laboratory_tests": lab_tests,
                "radiology_records": radiology_records,
            },

            "pharmacy_inventory": {
                "pharmacies": pharmacies,
                "inventory_items": inventory_items,
                "low_stock_items": low_stock_items,
            },

            "blood_bank": {
                "total_units": blood_units,
                "available_units": available_blood_units,
                "reserved_units": reserved_blood_units,
            },

            "finance": {
                "invoices": invoices,
                "paid_invoices": paid_invoices,
                "unpaid_invoices": unpaid_invoices,
                "invoice_total": round(invoice_total, 2),
                "amount_paid": round(invoice_paid, 2),
                "outstanding_balance": round(
                    invoice_balance,
                    2,
                ),
                "payments": payments,
                "completed_payments": completed_payments,
                "payment_collection": round(
                    payment_collection,
                    2,
                ),
                "billing_records": billing_records,
                "billing_total": round(
                    billing_total,
                    2,
                ),
            },

            "operational_health": {
                "bed_occupancy_percentage": bed_occupancy,
                "appointment_completion_percentage": (
                    appointment_completion
                ),
                "active_emergency_cases": active_emergencies,
                "critical_triage_cases": critical_triage,
                "outstanding_balance": round(
                    invoice_balance,
                    2,
                ),
                "alert_count": len(alerts),
                "status": (
                    "critical"
                    if any(
                        alert["severity"] == "critical"
                        for alert in alerts
                    )
                    else "attention"
                    if alerts
                    else "stable"
                ),
            },

            "alerts": alerts,
        }


dashboard_service = DashboardService()

