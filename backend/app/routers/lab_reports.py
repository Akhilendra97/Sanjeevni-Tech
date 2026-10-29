from app.core.dependencies import get_current_user_payload, require_permission
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.appointment import Appointment
from app.models.doctor import Doctor
from app.models.lab_sample import LabSample
from app.models.lab_test import LabTest
from app.models.lab_report import LabReport
from app.schemas.lab_report import LabReportCreate, LabReportResponse, LabReportUpdate
from app.services.lab_report_service import create_lab_report, delete_lab_report, get_lab_report_by_id, list_lab_reports, update_lab_report
from app.services.lab_access import lab_id_for_payload, require_sample_lab, require_report_lab

router = APIRouter(prefix="/lab-reports", tags=["Laboratory Reports"])

@router.post("", response_model=LabReportResponse, status_code=status.HTTP_201_CREATED,
             dependencies=[Depends(require_permission("laboratory.manage"))])
def create_report(data: LabReportCreate, db: Session = Depends(get_db),
                  payload: dict = Depends(get_current_user_payload)):
    lab_id = lab_id_for_payload(db, payload)
    if lab_id is not None:
        require_sample_lab(db, data.sample_id, lab_id)
    try:
        return create_lab_report(db, data)
    except ValueError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc

@router.get("", response_model=list[LabReportResponse],
            dependencies=[Depends(require_permission("laboratory.view"))])
def get_reports(db: Session = Depends(get_db), payload: dict = Depends(get_current_user_payload)):
    role = str(payload.get("role", "")).lower()
    lab_id = lab_id_for_payload(db, payload)
    if lab_id is not None:
        return (db.query(LabReport).join(LabSample, LabReport.sample_id == LabSample.id)
                .join(LabTest, LabSample.lab_test_id == LabTest.id)
                .filter(LabTest.lab_id == lab_id).order_by(LabReport.created_at.desc()).all())
    if role == "doctor":
        try:
            user_id = int(payload.get("sub"))
        except (TypeError, ValueError):
            raise HTTPException(status_code=401, detail="Invalid authenticated user.")
        doctor = db.query(Doctor).filter(Doctor.user_id == user_id).first()
        if doctor is None:
            raise HTTPException(status_code=403, detail="Doctor profile is not linked to this account.")
        patient_ids = db.query(Appointment.patient_id).filter(Appointment.doctor_id == doctor.id).distinct().subquery()
        return (db.query(LabReport).join(LabSample, LabReport.sample_id == LabSample.id)
                .filter(LabSample.patient_id.in_(patient_ids)).order_by(LabReport.created_at.desc()).all())
    return list_lab_reports(db)

@router.get("/{report_id}", response_model=LabReportResponse,
            dependencies=[Depends(require_permission("laboratory.view"))])
def get_report(report_id: int, db: Session = Depends(get_db),
               payload: dict = Depends(get_current_user_payload)):
    lab_id = lab_id_for_payload(db, payload)
    report = require_report_lab(db, report_id, lab_id) if lab_id is not None else get_lab_report_by_id(db, report_id)
    if report is None:
        raise HTTPException(status_code=404, detail="Laboratory report not found.")
    return report

@router.patch("/{report_id}", response_model=LabReportResponse,
              dependencies=[Depends(require_permission("laboratory.manage"))])
def update_report(report_id: int, data: LabReportUpdate, db: Session = Depends(get_db),
                  payload: dict = Depends(get_current_user_payload)):
    lab_id = lab_id_for_payload(db, payload)
    report = require_report_lab(db, report_id, lab_id) if lab_id is not None else get_lab_report_by_id(db, report_id)
    if report is None:
        raise HTTPException(status_code=404, detail="Laboratory report not found.")
    updates = data.model_dump(exclude_unset=True)
    if lab_id is not None and "sample_id" in updates:
        require_sample_lab(db, updates["sample_id"], lab_id)
    try:
        return update_lab_report(db, report, data)
    except ValueError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc

@router.delete("/{report_id}", status_code=status.HTTP_204_NO_CONTENT,
               dependencies=[Depends(require_permission("laboratory.manage"))])
def delete_report(report_id: int, db: Session = Depends(get_db),
                  payload: dict = Depends(get_current_user_payload)):
    lab_id = lab_id_for_payload(db, payload)
    report = require_report_lab(db, report_id, lab_id) if lab_id is not None else get_lab_report_by_id(db, report_id)
    if report is None:
        raise HTTPException(status_code=404, detail="Laboratory report not found.")
    delete_lab_report(db, report)
