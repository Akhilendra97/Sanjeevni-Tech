from datetime import date, datetime, time, timezone
from decimal import Decimal
from pathlib import Path
from typing import Any, Literal

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import (
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.admission import Admission
from app.models.appointment import Appointment
from app.models.bed import Bed
from app.models.billing import Billing
from app.models.doctor import Doctor
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


ReportType = Literal[
    "overview",
    "patient",
    "financial",
    "operational",
    "clinical",
]


REPORT_DIRECTORY = (
    Path(__file__).resolve().parents[2] / "storage" / "reports"
)


class ReportService:
    """
    Read-only hospital reporting and PDF generation service.
    """

    @staticmethod
    async def _count(
        db: Session,
        model: Any,
        *conditions: Any,
    ) -> int:
        statement = select(func.count()).select_from(model)

        if conditions:
            statement = statement.where(*conditions)

        result = db.execute(statement)

        return int(result.scalar_one() or 0)

    @staticmethod
    async def _sum(
        db: Session,
        column: Any,
        *conditions: Any,
    ) -> float:
        statement = select(
            func.coalesce(func.sum(column), 0)
        )

        if conditions:
            statement = statement.where(*conditions)

        result = db.execute(statement)

        value = result.scalar_one()

        return float(value or 0)

    @staticmethod
    def _range(
        start_date: date | None,
        end_date: date | None,
    ) -> tuple[datetime | None, datetime | None]:

        start_dt = (
            datetime.combine(
                start_date,
                time.min,
                tzinfo=timezone.utc,
            )
            if start_date
            else None
        )

        end_dt = (
            datetime.combine(
                end_date,
                time.max,
                tzinfo=timezone.utc,
            )
            if end_date
            else None
        )

        return start_dt, end_dt

    @staticmethod
    def _created_conditions(
        column: Any,
        start_dt: datetime | None,
        end_dt: datetime | None,
    ) -> list[Any]:

        conditions: list[Any] = []

        if start_dt is not None:
            conditions.append(column >= start_dt)

        if end_dt is not None:
            conditions.append(column <= end_dt)

        return conditions

    async def get_overview_report(
        self,
        db: Session,
        start_date: date | None = None,
        end_date: date | None = None,
    ) -> dict[str, Any]:

        start_dt, end_dt = self._range(
            start_date,
            end_date,
        )

        patient_conditions = self._created_conditions(
            Patient.created_at,
            start_dt,
            end_dt,
        )

        admission_conditions = self._created_conditions(
            Admission.created_at,
            start_dt,
            end_dt,
        )

        appointment_conditions = self._created_conditions(
            Appointment.created_at,
            start_dt,
            end_dt,
        )

        emergency_conditions = self._created_conditions(
            Emergency.created_at,
            start_dt,
            end_dt,
        )

        return {
            "report_type": "overview",
            "title": "Hospital Overview Report",
            "generated_at": datetime.now(timezone.utc),
            "period": {
                "start_date": start_date,
                "end_date": end_date,
            },
            "metrics": {
                "patients": await self._count(
                    db,
                    Patient,
                    *patient_conditions,
                ),
                "doctors": await self._count(
                    db,
                    Doctor,
                ),
                "nurses": await self._count(
                    db,
                    Nurse,
                ),
                "staff": await self._count(
                    db,
                    Staff,
                ),
                "admissions": await self._count(
                    db,
                    Admission,
                    *admission_conditions,
                ),
                "appointments": await self._count(
                    db,
                    Appointment,
                    *appointment_conditions,
                ),
                "emergencies": await self._count(
                    db,
                    Emergency,
                    *emergency_conditions,
                ),
                "prescriptions": await self._count(
                    db,
                    Prescription,
                ),
                "laboratory_tests": await self._count(
                    db,
                    LabTest,
                ),
                "radiology_orders": await self._count(
                    db,
                    Radiology,
                ),
                "surgeries": await self._count(
                    db,
                    Surgery,
                ),
                "beds": await self._count(
                    db,
                    Bed,
                ),
            },
        }

    async def get_patient_report(
        self,
        db: Session,
        patient_id: int,
    ) -> dict[str, Any]:

        patient = db.get(
            Patient,
            patient_id,
        )

        if patient is None:
            raise ValueError(
                "Patient not found."
            )

        return {
            "report_type": "patient",
            "title": "Patient Clinical Summary",
            "generated_at": datetime.now(timezone.utc),
            "patient": {
                "id": patient.id,
                "patient_number": patient.patient_number,
                "name": patient.full_name,
                "gender": patient.gender,
                "date_of_birth": patient.date_of_birth,
                "blood_group": patient.blood_group,
                "phone": patient.phone,
                "email": patient.email,
                "allergies": patient.allergies,
                "chronic_conditions": patient.chronic_conditions,
                "is_active": patient.is_active,
            },
            "activity": {
                "admissions": await self._count(
                    db,
                    Admission,
                    Admission.patient_id == patient_id,
                ),
                "appointments": await self._count(
                    db,
                    Appointment,
                    Appointment.patient_id == patient_id,
                ),
                "prescriptions": await self._count(
                    db,
                    Prescription,
                    Prescription.patient_id == patient_id,
                ),
                "emergencies": await self._count(
                    db,
                    Emergency,
                    Emergency.patient_id == patient_id,
                ),
                "radiology_orders": await self._count(
                    db,
                    Radiology,
                    Radiology.patient_id == patient_id,
                ),
                "invoices": await self._count(
                    db,
                    Invoice,
                    Invoice.patient_id == patient_id,
                ),
                "payments": await self._count(
                    db,
                    Payment,
                    Payment.patient_id == patient_id,
                ),
                "billing_records": await self._count(
                    db,
                    Billing,
                    Billing.patient_id == patient_id,
                ),
            },
            "financial": {
                "invoice_total": await self._sum(
                    db,
                    Invoice.total,
                    Invoice.patient_id == patient_id,
                ),
                "paid_total": await self._sum(
                    db,
                    Invoice.paid,
                    Invoice.patient_id == patient_id,
                ),
                "payment_total": await self._sum(
                    db,
                    Payment.amount,
                    Payment.patient_id == patient_id,
                ),
            },
        }

    async def get_financial_report(
        self,
        db: Session,
        start_date: date | None = None,
        end_date: date | None = None,
    ) -> dict[str, Any]:

        start_dt, end_dt = self._range(
            start_date,
            end_date,
        )

        invoice_conditions = self._created_conditions(
            Invoice.created_at,
            start_dt,
            end_dt,
        )

        payment_conditions = self._created_conditions(
            Payment.created_at,
            start_dt,
            end_dt,
        )

        billing_conditions = self._created_conditions(
            Billing.created_at,
            start_dt,
            end_dt,
        )

        invoice_total = await self._sum(
            db,
            Invoice.total,
            *invoice_conditions,
        )

        paid_total = await self._sum(
            db,
            Invoice.paid,
            *invoice_conditions,
        )

        balance_total = await self._sum(
            db,
            Invoice.balance,
            *invoice_conditions,
        )

        payment_total = await self._sum(
            db,
            Payment.amount,
            *payment_conditions,
        )

        billing_total = await self._sum(
            db,
            Billing.total_amount,
            *billing_conditions,
        )

        return {
            "report_type": "financial",
            "title": "Hospital Financial Report",
            "generated_at": datetime.now(timezone.utc),
            "period": {
                "start_date": start_date,
                "end_date": end_date,
            },
            "metrics": {
                "invoice_count": await self._count(
                    db,
                    Invoice,
                    *invoice_conditions,
                ),
                "payment_count": await self._count(
                    db,
                    Payment,
                    *payment_conditions,
                ),
                "billing_count": await self._count(
                    db,
                    Billing,
                    *billing_conditions,
                ),
                "invoice_total": invoice_total,
                "paid_total": paid_total,
                "balance_total": balance_total,
                "payment_total": payment_total,
                "billing_total": billing_total,
            },
        }

    async def get_operational_report(
        self,
        db: Session,
        start_date: date | None = None,
        end_date: date | None = None,
    ) -> dict[str, Any]:

        start_dt, end_dt = self._range(
            start_date,
            end_date,
        )

        admission_conditions = self._created_conditions(
            Admission.created_at,
            start_dt,
            end_dt,
        )

        appointment_conditions = self._created_conditions(
            Appointment.created_at,
            start_dt,
            end_dt,
        )

        emergency_conditions = self._created_conditions(
            Emergency.created_at,
            start_dt,
            end_dt,
        )

        surgery_conditions = self._created_conditions(
            Surgery.created_at,
            start_dt,
            end_dt,
        )

        total_beds = await self._count(
            db,
            Bed,
        )

        occupied_beds = await self._count(
            db,
            Bed,
            Bed.status == "occupied",
        )

        return {
            "report_type": "operational",
            "title": "Hospital Operations Report",
            "generated_at": datetime.now(timezone.utc),
            "period": {
                "start_date": start_date,
                "end_date": end_date,
            },
            "metrics": {
                "total_beds": total_beds,
                "occupied_beds": occupied_beds,
                "available_beds": await self._count(
                    db,
                    Bed,
                    Bed.status == "available",
                ),
                "maintenance_beds": await self._count(
                    db,
                    Bed,
                    Bed.status == "maintenance",
                ),
                "admissions": await self._count(
                    db,
                    Admission,
                    *admission_conditions,
                ),
                "appointments": await self._count(
                    db,
                    Appointment,
                    *appointment_conditions,
                ),
                "emergencies": await self._count(
                    db,
                    Emergency,
                    *emergency_conditions,
                ),
                "surgeries": await self._count(
                    db,
                    Surgery,
                    *surgery_conditions,
                ),
            },
        }

    async def get_clinical_report(
        self,
        db: Session,
        start_date: date | None = None,
        end_date: date | None = None,
    ) -> dict[str, Any]:

        start_dt, end_dt = self._range(
            start_date,
            end_date,
        )

        appointment_conditions = self._created_conditions(
            Appointment.created_at,
            start_dt,
            end_dt,
        )

        prescription_conditions = self._created_conditions(
            Prescription.created_at,
            start_dt,
            end_dt,
        )

        emergency_conditions = self._created_conditions(
            Emergency.created_at,
            start_dt,
            end_dt,
        )

        radiology_conditions = self._created_conditions(
            Radiology.created_at,
            start_dt,
            end_dt,
        )

        surgery_conditions = self._created_conditions(
            Surgery.created_at,
            start_dt,
            end_dt,
        )

        return {
            "report_type": "clinical",
            "title": "Clinical Services Report",
            "generated_at": datetime.now(timezone.utc),
            "period": {
                "start_date": start_date,
                "end_date": end_date,
            },
            "metrics": {
                "appointments": await self._count(
                    db,
                    Appointment,
                    *appointment_conditions,
                ),
                "prescriptions": await self._count(
                    db,
                    Prescription,
                    *prescription_conditions,
                ),
                "emergencies": await self._count(
                    db,
                    Emergency,
                    *emergency_conditions,
                ),
                "radiology_orders": await self._count(
                    db,
                    Radiology,
                    *radiology_conditions,
                ),
                "surgeries": await self._count(
                    db,
                    Surgery,
                    *surgery_conditions,
                ),
                "laboratory_tests": await self._count(
                    db,
                    LabTest,
                ),
                "doctors": await self._count(
                    db,
                    Doctor,
                ),
                "nurses": await self._count(
                    db,
                    Nurse,
                ),
            },
        }

    async def get_report(
        self,
        db: Session,
        report_type: ReportType,
        start_date: date | None = None,
        end_date: date | None = None,
        patient_id: int | None = None,
    ) -> dict[str, Any]:

        if (
            start_date is not None
            and end_date is not None
            and start_date > end_date
        ):
            raise ValueError(
                "Start date cannot be after end date."
            )

        if report_type == "overview":
            return await self.get_overview_report(
                db,
                start_date,
                end_date,
            )

        if report_type == "patient":
            if patient_id is None:
                raise ValueError(
                    "patient_id is required for patient reports."
                )

            return await self.get_patient_report(
                db,
                patient_id,
            )

        if report_type == "financial":
            return await self.get_financial_report(
                db,
                start_date,
                end_date,
            )

        if report_type == "operational":
            return await self.get_operational_report(
                db,
                start_date,
                end_date,
            )

        if report_type == "clinical":
            return await self.get_clinical_report(
                db,
                start_date,
                end_date,
            )

        raise ValueError(
            "Unsupported report type."
        )

    @staticmethod
    def _format_value(
        value: Any,
    ) -> str:

        if value is None:
            return "â€”"

        if isinstance(value, Decimal):
            return f"{float(value):,.2f}"

        if isinstance(value, float):
            return f"{value:,.2f}"

        if isinstance(value, (datetime, date)):
            return value.isoformat()

        if isinstance(value, bool):
            return "Yes" if value else "No"

        return str(value)

    def generate_pdf(
        self,
        data: dict[str, Any],
    ) -> Path:

        REPORT_DIRECTORY.mkdir(
            parents=True,
            exist_ok=True,
        )

        report_type = str(
            data.get(
                "report_type",
                "report",
            )
        )

        timestamp = datetime.now(
            timezone.utc
        ).strftime(
            "%Y%m%d_%H%M%S_%f"
        )

        output_path = (
            REPORT_DIRECTORY
            / f"{report_type}_report_{timestamp}.pdf"
        )

        styles = getSampleStyleSheet()

        title_style = ParagraphStyle(
            "ReportTitle",
            parent=styles["Title"],
            alignment=TA_CENTER,
            fontSize=20,
            leading=24,
            spaceAfter=8,
        )

        subtitle_style = ParagraphStyle(
            "ReportSubtitle",
            parent=styles["Normal"],
            alignment=TA_CENTER,
            fontSize=9,
            textColor=colors.grey,
            spaceAfter=12,
        )

        heading_style = ParagraphStyle(
            "ReportHeading",
            parent=styles["Heading2"],
            fontSize=12,
            leading=15,
            spaceBefore=10,
            spaceAfter=7,
        )

        cell_style = ParagraphStyle(
            "ReportCell",
            parent=styles["BodyText"],
            fontSize=8.5,
            leading=11,
        )

        document = SimpleDocTemplate(
            str(output_path),
            pagesize=A4,
            rightMargin=14 * mm,
            leftMargin=14 * mm,
            topMargin=14 * mm,
            bottomMargin=14 * mm,
            title=str(
                data.get(
                    "title",
                    "Hospital Report",
                )
            ),
            author="Sanjeevni Tech",
        )

        story: list[Any] = [
            Paragraph(
                str(
                    data.get(
                        "title",
                        "Hospital Report",
                    )
                ),
                title_style,
            ),
            Paragraph(
                "Sanjeevni Tech â€¢ Hospital Management System",
                subtitle_style,
            ),
        ]

        period = data.get("period")

        if isinstance(period, dict):
            period_text = (
                "Period: "
                f"{self._format_value(period.get('start_date'))}"
                " to "
                f"{self._format_value(period.get('end_date'))}"
            )

            story.append(
                Paragraph(
                    period_text,
                    subtitle_style,
                )
            )

        story.append(
            Paragraph(
                "Generated: "
                f"{self._format_value(data.get('generated_at'))}",
                subtitle_style,
            )
        )

        for section_name, section_value in data.items():

            if section_name in {
                "report_type",
                "title",
                "generated_at",
                "period",
            }:
                continue

            if not isinstance(
                section_value,
                dict,
            ):
                continue

            story.append(
                Paragraph(
                    section_name.replace(
                        "_",
                        " ",
                    ).title(),
                    heading_style,
                )
            )

            rows = [
                ["Metric", "Value"]
            ]

            for key, value in section_value.items():

                if isinstance(
                    value,
                    dict,
                ):
                    for nested_key, nested_value in value.items():

                        label = (
                            f"{key} â€¢ {nested_key}"
                            .replace(
                                "_",
                                " ",
                            )
                            .title()
                        )

                        rows.append(
                            [
                                Paragraph(
                                    label,
                                    cell_style,
                                ),
                                Paragraph(
                                    self._format_value(
                                        nested_value
                                    ),
                                    cell_style,
                                ),
                            ]
                        )

                else:
                    rows.append(
                        [
                            Paragraph(
                                key.replace(
                                    "_",
                                    " ",
                                ).title(),
                                cell_style,
                            ),
                            Paragraph(
                                self._format_value(
                                    value
                                ),
                                cell_style,
                            ),
                        ]
                    )

            table = Table(
                rows,
                colWidths=[
                    85 * mm,
                    85 * mm,
                ],
                repeatRows=1,
            )

            table.setStyle(
                TableStyle(
                    [
                        (
                            "BACKGROUND",
                            (0, 0),
                            (-1, 0),
                            colors.HexColor(
                                "#16324F"
                            ),
                        ),
                        (
                            "TEXTCOLOR",
                            (0, 0),
                            (-1, 0),
                            colors.white,
                        ),
                        (
                            "FONTNAME",
                            (0, 0),
                            (-1, 0),
                            "Helvetica-Bold",
                        ),
                        (
                            "GRID",
                            (0, 0),
                            (-1, -1),
                            0.4,
                            colors.HexColor(
                                "#C9D3DD"
                            ),
                        ),
                        (
                            "VALIGN",
                            (0, 0),
                            (-1, -1),
                            "TOP",
                        ),
                        (
                            "ROWBACKGROUNDS",
                            (0, 1),
                            (-1, -1),
                            [
                                colors.white,
                                colors.HexColor(
                                    "#F4F7FA"
                                ),
                            ],
                        ),
                        (
                            "LEFTPADDING",
                            (0, 0),
                            (-1, -1),
                            7,
                        ),
                        (
                            "RIGHTPADDING",
                            (0, 0),
                            (-1, -1),
                            7,
                        ),
                        (
                            "TOPPADDING",
                            (0, 0),
                            (-1, -1),
                            6,
                        ),
                        (
                            "BOTTOMPADDING",
                            (0, 0),
                            (-1, -1),
                            6,
                        ),
                    ]
                )
            )

            story.extend(
                [
                    table,
                    Spacer(1, 8),
                ]
            )

        document.build(story)

        return output_path


report_service = ReportService()


