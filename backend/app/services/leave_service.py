from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy import and_, select
from sqlalchemy.orm import Session

from app.models.leave import Leave
from app.models.user import User
from app.schemas.leave import LeaveCreate, LeaveUpdate


class LeaveService:

    VALID_STATUSES = {
        "pending",
        "approved",
        "rejected",
        "cancelled",
    }

    @staticmethod
    def _validate_dates(
        start_date,
        end_date,
    ) -> None:
        if end_date < start_date:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="End date cannot be before start date.",
            )

    @staticmethod
    def _validate_status(
        leave_status: str,
    ) -> None:
        if leave_status not in LeaveService.VALID_STATUSES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    "Invalid leave status. "
                    "Allowed values: pending, approved, "
                    "rejected, cancelled."
                ),
            )

    @staticmethod
    def _validate_user(
        db: Session,
        user_id: int,
        field_name: str,
    ) -> User:

        user = db.get(User, user_id)

        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"{field_name} user not found.",
            )

        return user

    @staticmethod
    def _check_overlap(
        db: Session,
        employee_id: int,
        start_date,
        end_date,
        exclude_leave_id: int | None = None,
    ) -> None:

        query = select(Leave).where(
            Leave.employee_id == employee_id,
            Leave.status.in_(["pending", "approved"]),
            Leave.start_date <= end_date,
            Leave.end_date >= start_date,
        )

        if exclude_leave_id is not None:
            query = query.where(
                Leave.id != exclude_leave_id
            )

        existing = db.scalar(query)

        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=(
                    "Leave dates overlap with an existing "
                    "pending or approved leave."
                ),
            )

    @staticmethod
    def create(
        db: Session,
        data: LeaveCreate,
    ) -> Leave:

        duplicate = db.scalar(
            select(Leave).where(
                Leave.leave_number == data.leave_number
            )
        )

        if duplicate:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Leave number already exists.",
            )

        LeaveService._validate_dates(
            data.start_date,
            data.end_date,
        )

        LeaveService._validate_status(
            data.status,
        )

        LeaveService._validate_user(
            db,
            data.employee_id,
            "Employee",
        )

        if data.approved_by is not None:
            LeaveService._validate_user(
                db,
                data.approved_by,
                "Approver",
            )

        if data.status in {"pending", "approved"}:
            LeaveService._check_overlap(
                db,
                data.employee_id,
                data.start_date,
                data.end_date,
            )

        approved_at = data.approved_at

        if data.status != "approved":
            approved_at = None

        if data.status == "approved" and data.approved_by is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Approved leave must have an approver.",
            )

        leave = Leave(
            leave_number=data.leave_number,
            employee_id=data.employee_id,
            leave_type=data.leave_type,
            start_date=data.start_date,
            end_date=data.end_date,
            reason=data.reason,
            status=data.status,
            approved_by=data.approved_by,
            approved_at=approved_at,
            remarks=data.remarks,
        )

        db.add(leave)
        db.commit()
        db.refresh(leave)

        return leave

    @staticmethod
    def get(
        db: Session,
        leave_id: int,
    ) -> Leave:

        leave = db.get(Leave, leave_id)

        if not leave:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Leave request not found.",
            )

        return leave

    @staticmethod
    def get_by_number(
        db: Session,
        leave_number: str,
    ) -> Leave:

        leave = db.scalar(
            select(Leave).where(
                Leave.leave_number == leave_number
            )
        )

        if not leave:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Leave request not found.",
            )

        return leave

    @staticmethod
    def list(
        db: Session,
        employee_id: int | None = None,
        leave_type: str | None = None,
        leave_status: str | None = None,
    ) -> list[Leave]:

        query = select(Leave).order_by(
            Leave.start_date.desc(),
            Leave.id.desc(),
        )

        if employee_id is not None:
            query = query.where(
                Leave.employee_id == employee_id
            )

        if leave_type is not None:
            query = query.where(
                Leave.leave_type == leave_type
            )

        if leave_status is not None:
            LeaveService._validate_status(
                leave_status
            )

            query = query.where(
                Leave.status == leave_status
            )

        return list(
            db.scalars(query).all()
        )

    @staticmethod
    def update(
        db: Session,
        leave_id: int,
        data: LeaveUpdate,
    ) -> Leave:

        leave = LeaveService.get(
            db,
            leave_id,
        )

        values = data.model_dump(
            exclude_unset=True
        )

        new_employee_id = values.get(
            "employee_id",
            leave.employee_id,
        )

        new_start_date = values.get(
            "start_date",
            leave.start_date,
        )

        new_end_date = values.get(
            "end_date",
            leave.end_date,
        )

        new_status = values.get(
            "status",
            leave.status,
        )

        new_approved_by = values.get(
            "approved_by",
            leave.approved_by,
        )

        LeaveService._validate_dates(
            new_start_date,
            new_end_date,
        )

        LeaveService._validate_status(
            new_status,
        )

        LeaveService._validate_user(
            db,
            new_employee_id,
            "Employee",
        )

        if new_approved_by is not None:
            LeaveService._validate_user(
                db,
                new_approved_by,
                "Approver",
            )

        new_leave_number = values.get(
            "leave_number",
            leave.leave_number,
        )

        duplicate = db.scalar(
            select(Leave).where(
                Leave.leave_number == new_leave_number,
                Leave.id != leave_id,
            )
        )

        if duplicate:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Leave number already exists.",
            )

        if new_status in {"pending", "approved"}:
            LeaveService._check_overlap(
                db,
                new_employee_id,
                new_start_date,
                new_end_date,
                exclude_leave_id=leave_id,
            )

        if new_status == "approved":
            if new_approved_by is None:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Approved leave must have an approver.",
                )

            if "approved_at" not in values:
                values["approved_at"] = datetime.now(
                    timezone.utc
                )

        elif new_status != "approved":
            values["approved_at"] = None

        for field, value in values.items():
            setattr(
                leave,
                field,
                value,
            )

        db.commit()
        db.refresh(leave)

        return leave

    @staticmethod
    def approve(
        db: Session,
        leave_id: int,
        approved_by: int,
        remarks: str | None = None,
    ) -> Leave:

        leave = LeaveService.get(
            db,
            leave_id,
        )

        LeaveService._validate_user(
            db,
            approved_by,
            "Approver",
        )

        if leave.status == "cancelled":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cancelled leave cannot be approved.",
            )

        if leave.status == "rejected":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Rejected leave cannot be approved directly.",
            )

        LeaveService._check_overlap(
            db,
            leave.employee_id,
            leave.start_date,
            leave.end_date,
            exclude_leave_id=leave.id,
        )

        leave.status = "approved"
        leave.approved_by = approved_by
        leave.approved_at = datetime.now(
            timezone.utc
        )

        if remarks is not None:
            leave.remarks = remarks

        db.commit()
        db.refresh(leave)

        return leave

    @staticmethod
    def reject(
        db: Session,
        leave_id: int,
        approved_by: int,
        remarks: str | None = None,
    ) -> Leave:

        leave = LeaveService.get(
            db,
            leave_id,
        )

        LeaveService._validate_user(
            db,
            approved_by,
            "Approver",
        )

        if leave.status == "cancelled":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cancelled leave cannot be rejected.",
            )

        leave.status = "rejected"
        leave.approved_by = approved_by
        leave.approved_at = datetime.now(
            timezone.utc
        )

        if remarks is not None:
            leave.remarks = remarks

        db.commit()
        db.refresh(leave)

        return leave

    @staticmethod
    def cancel(
        db: Session,
        leave_id: int,
        remarks: str | None = None,
    ) -> Leave:

        leave = LeaveService.get(
            db,
            leave_id,
        )

        if leave.status == "cancelled":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Leave is already cancelled.",
            )

        if leave.status == "rejected":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Rejected leave cannot be cancelled.",
            )

        leave.status = "cancelled"

        if remarks is not None:
            leave.remarks = remarks

        db.commit()
        db.refresh(leave)

        return leave

    @staticmethod
    def delete(
        db: Session,
        leave_id: int,
    ) -> None:

        leave = LeaveService.get(
            db,
            leave_id,
        )

        db.delete(leave)
        db.commit()
