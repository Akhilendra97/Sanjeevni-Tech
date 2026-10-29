from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.encoders import jsonable_encoder
from sqlalchemy.orm import Session

from app.core.constants import UserRole
from app.core.database import get_db
from app.core.dependencies import get_current_user_payload
from app.models.appointment import Appointment
from app.models.billing import Billing
from app.models.document import Document
from app.models.insurance import Insurance
from app.models.imaging_report import ImagingReport
from app.models.imaging_study import ImagingStudy
from app.models.invoice import Invoice
from app.models.lab_report import LabReport
from app.models.lab_sample import LabSample
from app.models.lab_test import LabTest
from app.models.medical_record import MedicalRecord
from app.models.patient import Patient
from app.models.payment import Payment
from app.models.prescription import Prescription
from app.models.radiology import Radiology
from app.models.user import User

router = APIRouter(prefix="/patient-portal", tags=["Patient Portal"])


def _patient_context(db: Session, payload: dict) -> tuple[User, Patient]:
    if payload.get("role") != UserRole.PATIENT.value:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Patient portal access is required.",
        )
    try:
        user_id = int(payload.get("sub"))
    except (TypeError, ValueError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authenticated user.",
        )

    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authenticated account was not found.",
        )

    patient = (
        db.query(Patient)
        .filter(Patient.user_id == user_id, Patient.is_active.is_(True))
        .first()
    )
    if patient is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Patient profile is not linked to this account.",
        )
    return user, patient


def _columns(record, omit: set[str] | None = None) -> dict:
    omit = omit or set()
    values = {
        column.name: getattr(record, column.name)
        for column in record.__table__.columns
        if column.name not in omit
    }
    return jsonable_encoder(values)


@router.get("/{section}")
def get_patient_portal_section(
    section: str,
    db: Session = Depends(get_db),
    payload: dict = Depends(get_current_user_payload),
):
    """Return only records belonging to the authenticated patient's linked profile."""
    user, patient = _patient_context(db, payload)

    if section == "profile":
        result = {
            "id": patient.id,
            "patient_number": patient.patient_number,
            "full_name": user.full_name,
            "name": user.full_name,
            "email": patient.email or user.email,
            "role": payload.get("role"),
            "phone": patient.phone or user.phone,
            "status": user.status,
            "is_active": patient.is_active,
            "date_of_birth": patient.date_of_birth,
            "gender": patient.gender,
            "blood_group": patient.blood_group,
            "address": patient.address,
            "city": patient.city,
            "state": patient.state,
            "postal_code": patient.postal_code,
            "emergency_contact_name": patient.emergency_contact_name,
            "emergency_contact_phone": patient.emergency_contact_phone,
            "allergies": patient.allergies,
            "chronic_conditions": patient.chronic_conditions,
        }
        return jsonable_encoder(result)

    if section == "appointments":
        rows = (
            db.query(Appointment)
            .filter(Appointment.patient_id == patient.id)
            .order_by(Appointment.appointment_date.desc(), Appointment.appointment_time.desc())
            .all()
        )
        result = []
        for row in rows:
            item = _columns(row)
            item["date"] = row.appointment_date
            item["doctor_name"] = (
                row.doctor.user.full_name
                if row.doctor and row.doctor.user
                else None
            )
            item["department_name"] = (
                row.doctor.department.name
                if row.doctor and row.doctor.department
                else None
            )
            result.append(item)
        return jsonable_encoder(result)

    if section == "history":
        rows = (
            db.query(MedicalRecord)
            .filter(MedicalRecord.patient_id == patient.id)
            .order_by(MedicalRecord.created_at.desc())
            .all()
        )
        return jsonable_encoder([
            {**_columns(row), "record_date": row.created_at}
            for row in rows
        ])

    if section == "prescriptions":
        rows = (
            db.query(Prescription)
            .filter(Prescription.patient_id == patient.id)
            .order_by(Prescription.prescription_date.desc())
            .all()
        )
        return jsonable_encoder([
            {
                **_columns(row),
                "medicine_name": row.medicines,
                "prescribed_date": row.prescription_date,
            }
            for row in rows
        ])

    if section == "labs":
        rows = (
            db.query(LabReport, LabSample, LabTest)
            .join(LabSample, LabReport.sample_id == LabSample.id)
            .join(LabTest, LabSample.lab_test_id == LabTest.id)
            .filter(LabSample.patient_id == patient.id)
            .order_by(LabReport.created_at.desc())
            .all()
        )
        return jsonable_encoder([
            {
                **_columns(report),
                "test_name": test.name,
                "test_date": sample.collected_at or sample.created_at,
                "sample_number": sample.sample_number,
                "result_summary": report.result,
            }
            for report, sample, test in rows
        ])

    if section == "radiology":
        rows = (
            db.query(ImagingReport, ImagingStudy, Radiology)
            .join(ImagingStudy, ImagingReport.study_id == ImagingStudy.id)
            .join(Radiology, ImagingStudy.radiology_id == Radiology.id)
            .filter(Radiology.patient_id == patient.id)
            .order_by(ImagingReport.reported_at.desc(), ImagingReport.created_at.desc())
            .all()
        )
        return jsonable_encoder([
            {
                **_columns(report, {"notes"}),
                "report_number": report.report_number,
                "study_name": study.study_description or study.modality,
                "modality": study.modality,
                "study_date": study.study_date,
                "report_date": report.reported_at or report.created_at,
                "status": report.report_status,
                "findings": report.findings,
                "impression": report.impression,
            }
            for report, study, radiology in rows
        ])

    if section == "payments":
        rows = (
            db.query(Payment)
            .filter(Payment.patient_id == patient.id)
            .order_by(Payment.payment_date.desc())
            .all()
        )
        return jsonable_encoder(rows and [
            {
                **_columns(row),
                "transaction_id": row.transaction_reference,
            }
            for row in rows
        ] or [])

    if section == "bills":
        billing_rows = (
            db.query(Billing)
            .filter(Billing.patient_id == patient.id)
            .order_by(Billing.bill_date.desc())
            .all()
        )
        invoice_rows = (
            db.query(Invoice)
            .filter(Invoice.patient_id == patient.id)
            .order_by(Invoice.invoice_date.desc())
            .all()
        )
        return jsonable_encoder([
            {
                **_columns(row),
                "bill_number": row.bill_number,
                "bill_date": row.bill_date,
                "total_amount": row.total_amount,
                "payment_status": row.payment_status,
                "source": "billing",
            }
            for row in billing_rows
        ] + [
            {
                **_columns(row),
                "bill_number": row.invoice_number,
                "bill_date": row.invoice_date,
                "total_amount": row.total_amount,
                "payment_status": row.status,
                "source": "invoice",
            }
            for row in invoice_rows
        ])

    if section == "documents":
        rows = (
            db.query(Document)
            .filter(
                Document.patient_id == patient.id,
                Document.is_active.is_(True),
            )
            .order_by(Document.created_at.desc())
            .all()
        )
        return jsonable_encoder([
            {
                **_columns(row, {"file_path"}),
                "title": row.document_title,
                "name": row.document_title,
            }
            for row in rows
        ])

    if section == "insurance":
        rows = (
            db.query(Insurance)
            .filter(Insurance.patient_id == patient.id)
            .order_by(Insurance.is_primary.desc(), Insurance.policy_end_date.desc())
            .all()
        )
        return jsonable_encoder([
            {
                **_columns(row),
                "provider_name": row.insurance_provider,
                "coverage_amount": row.sum_insured,
                "valid_until": row.policy_end_date,
            }
            for row in rows
        ])

    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="Unknown patient portal section.",
    )
