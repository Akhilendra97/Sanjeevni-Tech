from __future__ import annotations

from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy import and_
from sqlalchemy.orm import Session

from app.models.department import Department
from app.models.doctor import Doctor
from app.models.operation_theatre import OperationTheatre
from app.models.patient import Patient
from app.models.surgery import Surgery
from app.schemas.surgery import SurgeryCreate, SurgeryUpdate


class SurgeryService:
    VALID_SURGERY_TYPES = {
        "elective",
        "emergency",
    }

    VALID_STATUSES = {
        "scheduled",
        "in_progress",
        "completed",
        "cancelled",
    }

    @staticmethod
    def _validate_datetime_range(
        scheduled_start: datetime,
        scheduled_end: datetime,
    ) -> None:
        if scheduled_end <= scheduled_start:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Scheduled end time must be after scheduled start time.",
            )

    @staticmethod
    def _validate_surgery_type(
        surgery_type: str,
    ) -> None:
        if surgery_type not in SurgeryService.VALID_SURGERY_TYPES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    "Invalid surgery type. "
                    f"Allowed values: {sorted(SurgeryService.VALID_SURGERY_TYPES)}"
                ),
            )

    @staticmethod
    def _validate_status(
        status_value: str,
    ) -> None:
        if status_value not in SurgeryService.VALID_STATUSES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    "Invalid surgery status. "
                    f"Allowed values: {sorted(SurgeryService.VALID_STATUSES)}"
                ),
            )

    @staticmethod
    def _validate_references(
        db: Session,
        patient_id: int,
        operation_theatre_id: int,
        department_id: int,
        surgeon_id: int,
        anaesthetist_id: int | None,
    ) -> OperationTheatre:
        patient = db.get(Patient, patient_id)

        if not patient:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Patient not found.",
            )

        department = db.get(Department, department_id)

        if not department:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Department not found.",
            )

        surgeon = db.get(Doctor, surgeon_id)

        if not surgeon:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Surgeon not found.",
            )

        anaesthetist = None

        if anaesthetist_id is not None:
            anaesthetist = db.get(Doctor, anaesthetist_id)

            if not anaesthetist:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Anaesthetist not found.",
                )

        operation_theatre = db.get(
            OperationTheatre,
            operation_theatre_id,
        )

        if not operation_theatre:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Operation theatre not found.",
            )

        if operation_theatre.patient_id != patient_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    "Patient does not match the patient assigned "
                    "to the selected operation theatre."
                ),
            )

        if operation_theatre.department_id != department_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    "Department does not match the department assigned "
                    "to the selected operation theatre."
                ),
            )

        if operation_theatre.surgeon_id != surgeon_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    "Surgeon does not match the surgeon assigned "
                    "to the selected operation theatre."
                ),
            )

        if (
            anaesthetist_id is not None
            and operation_theatre.anaesthetist_id != anaesthetist_id
        ):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    "Anaesthetist does not match the anaesthetist "
                    "assigned to the selected operation theatre."
                ),
            )

        return operation_theatre

    @staticmethod
    def _validate_time_with_ot(
        operation_theatre: OperationTheatre,
        scheduled_start: datetime,
        scheduled_end: datetime,
    ) -> None:
        if operation_theatre.status == "cancelled":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot schedule surgery in a cancelled operation theatre slot.",
            )

        if scheduled_start < operation_theatre.scheduled_start:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    "Surgery scheduled start cannot be earlier "
                    "than the operation theatre start time."
                ),
            )

        if scheduled_end > operation_theatre.scheduled_end:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    "Surgery scheduled end cannot be later "
                    "than the operation theatre end time."
                ),
            )

    @staticmethod
    def _check_schedule_conflict(
        db: Session,
        scheduled_start: datetime,
        scheduled_end: datetime,
        operation_theatre_id: int,
        surgeon_id: int,
        anaesthetist_id: int | None,
        exclude_id: int | None = None,
    ) -> None:
        overlap_condition = and_(
            Surgery.scheduled_start < scheduled_end,
            Surgery.scheduled_end > scheduled_start,
        )

        query = db.query(Surgery).filter(
            overlap_condition,
            Surgery.status != "cancelled",
        )

        if exclude_id is not None:
            query = query.filter(
                Surgery.id != exclude_id,
            )

        conflicts = query.all()

        for existing in conflicts:
            if existing.operation_theatre_id == operation_theatre_id:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=(
                        "Another surgery is already scheduled "
                        "in the selected operation theatre during this time."
                    ),
                )

            if existing.surgeon_id == surgeon_id:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=(
                        "Surgeon already has another surgery "
                        "scheduled during this time."
                    ),
                )

            if (
                anaesthetist_id is not None
                and existing.anaesthetist_id == anaesthetist_id
            ):
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=(
                        "Anaesthetist already has another surgery "
                        "scheduled during this time."
                    ),
                )

    @staticmethod
    def create(
        db: Session,
        data: SurgeryCreate,
    ) -> Surgery:
        duplicate = (
            db.query(Surgery)
            .filter(
                Surgery.surgery_number == data.surgery_number,
            )
            .first()
        )

        if duplicate:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Surgery number already exists.",
            )

        SurgeryService._validate_datetime_range(
            data.scheduled_start,
            data.scheduled_end,
        )

        SurgeryService._validate_surgery_type(
            data.surgery_type,
        )

        SurgeryService._validate_status(
            data.status,
        )

        operation_theatre = SurgeryService._validate_references(
            db,
            data.patient_id,
            data.operation_theatre_id,
            data.department_id,
            data.surgeon_id,
            data.anaesthetist_id,
        )

        SurgeryService._validate_time_with_ot(
            operation_theatre,
            data.scheduled_start,
            data.scheduled_end,
        )

        SurgeryService._check_schedule_conflict(
            db,
            data.scheduled_start,
            data.scheduled_end,
            data.operation_theatre_id,
            data.surgeon_id,
            data.anaesthetist_id,
        )

        surgery = Surgery(
            **data.model_dump(),
        )

        db.add(surgery)
        db.commit()
        db.refresh(surgery)

        return surgery

    @staticmethod
    def get(
        db: Session,
        surgery_id: int,
    ) -> Surgery:
        surgery = db.get(
            Surgery,
            surgery_id,
        )

        if not surgery:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Surgery not found.",
            )

        return surgery

    @staticmethod
    def get_by_number(
        db: Session,
        surgery_number: str,
    ) -> Surgery:
        surgery = (
            db.query(Surgery)
            .filter(
                Surgery.surgery_number == surgery_number,
            )
            .first()
        )

        if not surgery:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Surgery not found.",
            )

        return surgery

    @staticmethod
    def list(
        db: Session,
        patient_id: int | None = None,
        operation_theatre_id: int | None = None,
        department_id: int | None = None,
        surgeon_id: int | None = None,
        status_value: str | None = None,
        surgery_type: str | None = None,
    ) -> list[Surgery]:
        query = db.query(Surgery)

        if patient_id is not None:
            query = query.filter(
                Surgery.patient_id == patient_id,
            )

        if operation_theatre_id is not None:
            query = query.filter(
                Surgery.operation_theatre_id == operation_theatre_id,
            )

        if department_id is not None:
            query = query.filter(
                Surgery.department_id == department_id,
            )

        if surgeon_id is not None:
            query = query.filter(
                Surgery.surgeon_id == surgeon_id,
            )

        if status_value is not None:
            SurgeryService._validate_status(
                status_value,
            )

            query = query.filter(
                Surgery.status == status_value,
            )

        if surgery_type is not None:
            SurgeryService._validate_surgery_type(
                surgery_type,
            )

            query = query.filter(
                Surgery.surgery_type == surgery_type,
            )

        return query.order_by(
            Surgery.scheduled_start.asc(),
        ).all()

    @staticmethod
    def update(
        db: Session,
        surgery_id: int,
        data: SurgeryUpdate,
    ) -> Surgery:
        surgery = SurgeryService.get(
            db,
            surgery_id,
        )

        values = data.model_dump(
            exclude_unset=True,
        )

        if not values:
            return surgery

        new_patient_id = values.get(
            "patient_id",
            surgery.patient_id,
        )

        new_ot_id = values.get(
            "operation_theatre_id",
            surgery.operation_theatre_id,
        )

        new_department_id = values.get(
            "department_id",
            surgery.department_id,
        )

        new_surgeon_id = values.get(
            "surgeon_id",
            surgery.surgeon_id,
        )

        new_anaesthetist_id = values.get(
            "anaesthetist_id",
            surgery.anaesthetist_id,
        )

        new_start = values.get(
            "scheduled_start",
            surgery.scheduled_start,
        )

        new_end = values.get(
            "scheduled_end",
            surgery.scheduled_end,
        )

        new_surgery_type = values.get(
            "surgery_type",
            surgery.surgery_type,
        )

        new_status = values.get(
            "status",
            surgery.status,
        )

        SurgeryService._validate_datetime_range(
            new_start,
            new_end,
        )

        SurgeryService._validate_surgery_type(
            new_surgery_type,
        )

        SurgeryService._validate_status(
            new_status,
        )

        operation_theatre = SurgeryService._validate_references(
            db,
            new_patient_id,
            new_ot_id,
            new_department_id,
            new_surgeon_id,
            new_anaesthetist_id,
        )

        SurgeryService._validate_time_with_ot(
            operation_theatre,
            new_start,
            new_end,
        )

        SurgeryService._check_schedule_conflict(
            db,
            new_start,
            new_end,
            new_ot_id,
            new_surgeon_id,
            new_anaesthetist_id,
            exclude_id=surgery_id,
        )

        if new_status == "cancelled":
            cancellation_reason = values.get(
                "cancellation_reason",
                surgery.cancellation_reason,
            )

            if not cancellation_reason:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Cancellation reason is required.",
                )

        for field, value in values.items():
            setattr(
                surgery,
                field,
                value,
            )

        db.commit()
        db.refresh(surgery)

        return surgery

    @staticmethod
    def start(
        db: Session,
        surgery_id: int,
    ) -> Surgery:
        surgery = SurgeryService.get(
            db,
            surgery_id,
        )

        if surgery.status == "cancelled":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cancelled surgery cannot be started.",
            )

        if surgery.status == "completed":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Completed surgery cannot be started again.",
            )

        if surgery.status == "in_progress":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Surgery is already in progress.",
            )

        surgery.status = "in_progress"
        surgery.actual_start = datetime.now(
            timezone.utc,
        )

        db.commit()
        db.refresh(surgery)

        return surgery

    @staticmethod
    def complete(
        db: Session,
        surgery_id: int,
    ) -> Surgery:
        surgery = SurgeryService.get(
            db,
            surgery_id,
        )

        if surgery.status == "cancelled":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cancelled surgery cannot be completed.",
            )

        if surgery.status != "in_progress":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only an in-progress surgery can be completed.",
            )

        surgery.status = "completed"
        surgery.actual_end = datetime.now(
            timezone.utc,
        )

        db.commit()
        db.refresh(surgery)

        return surgery

    @staticmethod
    def cancel(
        db: Session,
        surgery_id: int,
        cancellation_reason: str,
    ) -> Surgery:
        surgery = SurgeryService.get(
            db,
            surgery_id,
        )

        if surgery.status == "completed":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Completed surgery cannot be cancelled.",
            )

        if not cancellation_reason.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cancellation reason is required.",
            )

        surgery.status = "cancelled"
        surgery.cancellation_reason = cancellation_reason.strip()

        db.commit()
        db.refresh(surgery)

        return surgery

    @staticmethod
    def delete(
        db: Session,
        surgery_id: int,
    ) -> None:
        surgery = SurgeryService.get(
            db,
            surgery_id,
        )

        db.delete(surgery)
        db.commit()
