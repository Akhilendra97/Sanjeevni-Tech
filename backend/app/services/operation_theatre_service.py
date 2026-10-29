from __future__ import annotations

from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy import and_, or_
from sqlalchemy.orm import Session

from app.models.department import Department
from app.models.doctor import Doctor
from app.models.operation_theatre import OperationTheatre
from app.models.patient import Patient
from app.models.staff import Staff
from app.schemas.operation_theatre import (
    OperationTheatreCreate,
    OperationTheatreUpdate,
)


class OperationTheatreService:
    VALID_SURGERY_TYPES = {"elective", "emergency"}

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
    def _validate_status(status_value: str) -> None:
        if status_value not in OperationTheatreService.VALID_STATUSES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    "Invalid operation theatre status. "
                    f"Allowed values: {sorted(OperationTheatreService.VALID_STATUSES)}"
                ),
            )

    @staticmethod
    def _validate_surgery_type(surgery_type: str) -> None:
        if surgery_type not in OperationTheatreService.VALID_SURGERY_TYPES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    "Invalid surgery type. "
                    f"Allowed values: {sorted(OperationTheatreService.VALID_SURGERY_TYPES)}"
                ),
            )

    @staticmethod
    def _validate_references(
        db: Session,
        department_id: int,
        patient_id: int,
        surgeon_id: int,
        anaesthetist_id: int | None,
        assigned_staff_id: int | None,
    ) -> None:
        if not db.get(Department, department_id):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Department not found.",
            )

        if not db.get(Patient, patient_id):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Patient not found.",
            )

        if not db.get(Doctor, surgeon_id):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Surgeon not found.",
            )

        if anaesthetist_id is not None:
            if not db.get(Doctor, anaesthetist_id):
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Anaesthetist not found.",
                )

        if assigned_staff_id is not None:
            if not db.get(Staff, assigned_staff_id):
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Assigned staff member not found.",
                )

    @staticmethod
    def _check_schedule_conflict(
        db: Session,
        scheduled_start: datetime,
        scheduled_end: datetime,
        ot_number: str,
        surgeon_id: int,
        anaesthetist_id: int | None,
        exclude_id: int | None = None,
    ) -> None:
        overlap_condition = and_(
            OperationTheatre.scheduled_start < scheduled_end,
            OperationTheatre.scheduled_end > scheduled_start,
        )

        query = db.query(OperationTheatre).filter(
            overlap_condition,
            OperationTheatre.status != "cancelled",
        )

        if exclude_id is not None:
            query = query.filter(OperationTheatre.id != exclude_id)

        conflicts = query.all()

        for existing in conflicts:
            if existing.ot_number == ot_number:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=(
                        "Operation theatre is already scheduled "
                        "during the requested time."
                    ),
                )

            if existing.surgeon_id == surgeon_id:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=(
                        "Surgeon already has another operation "
                        "scheduled during the requested time."
                    ),
                )

            if (
                anaesthetist_id is not None
                and existing.anaesthetist_id == anaesthetist_id
            ):
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=(
                        "Anaesthetist already has another operation "
                        "scheduled during the requested time."
                    ),
                )

    @staticmethod
    def create(
        db: Session,
        data: OperationTheatreCreate,
    ) -> OperationTheatre:
        existing = (
            db.query(OperationTheatre)
            .filter(
                OperationTheatre.ot_number == data.ot_number,
            )
            .first()
        )

        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Operation theatre number already exists.",
            )

        OperationTheatreService._validate_datetime_range(
            data.scheduled_start,
            data.scheduled_end,
        )

        OperationTheatreService._validate_status(data.status)
        OperationTheatreService._validate_surgery_type(data.surgery_type)

        OperationTheatreService._validate_references(
            db,
            data.department_id,
            data.patient_id,
            data.surgeon_id,
            data.anaesthetist_id,
            data.assigned_staff_id,
        )

        OperationTheatreService._check_schedule_conflict(
            db,
            data.scheduled_start,
            data.scheduled_end,
            data.ot_number,
            data.surgeon_id,
            data.anaesthetist_id,
        )

        operation = OperationTheatre(**data.model_dump())

        db.add(operation)
        db.commit()
        db.refresh(operation)

        return operation

    @staticmethod
    def get(
        db: Session,
        operation_id: int,
    ) -> OperationTheatre:
        operation = db.get(OperationTheatre, operation_id)

        if not operation:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Operation theatre record not found.",
            )

        return operation

    @staticmethod
    def get_by_number(
        db: Session,
        ot_number: str,
    ) -> OperationTheatre:
        operation = (
            db.query(OperationTheatre)
            .filter(
                OperationTheatre.ot_number == ot_number,
            )
            .first()
        )

        if not operation:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Operation theatre record not found.",
            )

        return operation

    @staticmethod
    def list(
        db: Session,
        department_id: int | None = None,
        patient_id: int | None = None,
        surgeon_id: int | None = None,
        status_value: str | None = None,
        surgery_type: str | None = None,
    ) -> list[OperationTheatre]:
        query = db.query(OperationTheatre)

        if department_id is not None:
            query = query.filter(
                OperationTheatre.department_id == department_id
            )

        if patient_id is not None:
            query = query.filter(
                OperationTheatre.patient_id == patient_id
            )

        if surgeon_id is not None:
            query = query.filter(
                OperationTheatre.surgeon_id == surgeon_id
            )

        if status_value is not None:
            OperationTheatreService._validate_status(status_value)
            query = query.filter(
                OperationTheatre.status == status_value
            )

        if surgery_type is not None:
            OperationTheatreService._validate_surgery_type(surgery_type)
            query = query.filter(
                OperationTheatre.surgery_type == surgery_type
            )

        return query.order_by(
            OperationTheatre.scheduled_start.asc()
        ).all()

    @staticmethod
    def update(
        db: Session,
        operation_id: int,
        data: OperationTheatreUpdate,
    ) -> OperationTheatre:
        operation = OperationTheatreService.get(
            db,
            operation_id,
        )

        values = data.model_dump(exclude_unset=True)

        if not values:
            return operation

        new_department_id = values.get(
            "department_id",
            operation.department_id,
        )
        new_patient_id = values.get(
            "patient_id",
            operation.patient_id,
        )
        new_surgeon_id = values.get(
            "surgeon_id",
            operation.surgeon_id,
        )
        new_anaesthetist_id = values.get(
            "anaesthetist_id",
            operation.anaesthetist_id,
        )
        new_staff_id = values.get(
            "assigned_staff_id",
            operation.assigned_staff_id,
        )

        new_start = values.get(
            "scheduled_start",
            operation.scheduled_start,
        )
        new_end = values.get(
            "scheduled_end",
            operation.scheduled_end,
        )

        new_ot_number = values.get(
            "ot_number",
            operation.ot_number,
        )

        new_surgery_type = values.get(
            "surgery_type",
            operation.surgery_type,
        )

        new_status = values.get(
            "status",
            operation.status,
        )

        OperationTheatreService._validate_datetime_range(
            new_start,
            new_end,
        )

        OperationTheatreService._validate_surgery_type(
            new_surgery_type,
        )

        OperationTheatreService._validate_status(
            new_status,
        )

        OperationTheatreService._validate_references(
            db,
            new_department_id,
            new_patient_id,
            new_surgeon_id,
            new_anaesthetist_id,
            new_staff_id,
        )

        if new_ot_number != operation.ot_number:
            duplicate = (
                db.query(OperationTheatre)
                .filter(
                    OperationTheatre.ot_number == new_ot_number,
                    OperationTheatre.id != operation_id,
                )
                .first()
            )

            if duplicate:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="Operation theatre number already exists.",
                )

        OperationTheatreService._check_schedule_conflict(
            db,
            new_start,
            new_end,
            new_ot_number,
            new_surgeon_id,
            new_anaesthetist_id,
            exclude_id=operation_id,
        )

        if new_status == "cancelled":
            cancellation_reason = values.get(
                "cancellation_reason",
                operation.cancellation_reason,
            )

            if not cancellation_reason:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Cancellation reason is required.",
                )

        for field, value in values.items():
            setattr(operation, field, value)

        db.commit()
        db.refresh(operation)

        return operation

    @staticmethod
    def start(
        db: Session,
        operation_id: int,
    ) -> OperationTheatre:
        operation = OperationTheatreService.get(
            db,
            operation_id,
        )

        if operation.status == "cancelled":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cancelled operation cannot be started.",
            )

        if operation.status == "completed":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Completed operation cannot be started again.",
            )

        if operation.status == "in_progress":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Operation is already in progress.",
            )

        operation.status = "in_progress"
        operation.actual_start = datetime.now(timezone.utc)

        db.commit()
        db.refresh(operation)

        return operation

    @staticmethod
    def complete(
        db: Session,
        operation_id: int,
    ) -> OperationTheatre:
        operation = OperationTheatreService.get(
            db,
            operation_id,
        )

        if operation.status == "cancelled":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cancelled operation cannot be completed.",
            )

        if operation.status != "in_progress":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only an operation in progress can be completed.",
            )

        operation.status = "completed"
        operation.actual_end = datetime.now(timezone.utc)

        db.commit()
        db.refresh(operation)

        return operation

    @staticmethod
    def cancel(
        db: Session,
        operation_id: int,
        cancellation_reason: str,
    ) -> OperationTheatre:
        operation = OperationTheatreService.get(
            db,
            operation_id,
        )

        if operation.status == "completed":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Completed operation cannot be cancelled.",
            )

        if not cancellation_reason.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cancellation reason is required.",
            )

        operation.status = "cancelled"
        operation.cancellation_reason = cancellation_reason.strip()

        db.commit()
        db.refresh(operation)

        return operation

    @staticmethod
    def delete(
        db: Session,
        operation_id: int,
    ) -> None:
        operation = OperationTheatreService.get(
            db,
            operation_id,
        )

        db.delete(operation)
        db.commit()
