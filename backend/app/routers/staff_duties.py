from datetime import date, datetime, time, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, joinedload

from app.core.constants import UserRole
from app.core.database import get_db
from app.core.dependencies import get_current_user_payload
from app.models.staff import Staff
from app.models.staff_duty_assignment import StaffDutyAssignment
from app.models.user import User
from app.models.department import Department
from app.schemas.staff_duty_assignment import (
    AssignWeekRequest,
    StaffDutyAssignmentResponse,
    UpdateStaffDutyRequest,
)

router = APIRouter(prefix="/staff-duties", tags=["Staff Duty Assignments"])
SHIFTS = (
    ("morning", time(6, 0), time(14, 0)),
    ("evening", time(14, 0), time(22, 0)),
    ("night", time(22, 0), time(6, 0)),
)


def _role(payload: dict) -> str:
    return str(payload.get("role", "")).strip().lower()


def _user_id(payload: dict) -> int:
    try:
        return int(payload.get("sub"))
    except (TypeError, ValueError):
        raise HTTPException(status_code=401, detail="Invalid authenticated user.")


def _serialize(row: StaffDutyAssignment, staff: Staff, user: User, department: Department | None):
    return {
        "id": row.id,
        "staff_id": staff.id,
        "employee_id": staff.employee_id,
        "full_name": user.full_name,
        "designation": staff.designation,
        "department_name": department.name if department else None,
        "duty_date": row.duty_date,
        "shift": row.shift,
        "start_time": row.start_time,
        "end_time": row.end_time,
        "status": row.status,
        "notes": row.notes,
        "created_at": row.created_at,
    }


def _rows_query():
    return (
        select(StaffDutyAssignment, Staff, User, Department)
        .join(Staff, Staff.id == StaffDutyAssignment.staff_id)
        .join(User, User.id == Staff.user_id)
        .outerjoin(Department, Department.id == Staff.department_id)
    )


@router.get("/me", response_model=list[StaffDutyAssignmentResponse])
def my_duties(
    payload: dict = Depends(get_current_user_payload),
    db: Session = Depends(get_db),
):
    user_id = _user_id(payload)
    staff = db.scalar(select(Staff).where(Staff.user_id == user_id))
    if staff is None:
        raise HTTPException(status_code=403, detail="No staff profile is linked to this account.")
    rows = db.execute(
        _rows_query().where(StaffDutyAssignment.staff_id == staff.id).order_by(StaffDutyAssignment.duty_date)
    ).all()
    return [_serialize(*row) for row in rows]


@router.get("", response_model=list[StaffDutyAssignmentResponse])
def all_duties(
    start_date: date | None = None,
    end_date: date | None = None,
    payload: dict = Depends(get_current_user_payload),
    db: Session = Depends(get_db),
):
    if _role(payload) != UserRole.ADMIN.value:
        raise HTTPException(status_code=403, detail="Only administrators can view the full staff duty roster.")
    query = _rows_query()
    if start_date:
        query = query.where(StaffDutyAssignment.duty_date >= start_date)
    if end_date:
        query = query.where(StaffDutyAssignment.duty_date <= end_date)
    rows = db.execute(query.order_by(StaffDutyAssignment.duty_date, StaffDutyAssignment.shift, Staff.employee_id)).all()
    return [_serialize(*row) for row in rows]


@router.post("/assign-week", response_model=list[StaffDutyAssignmentResponse], status_code=status.HTTP_200_OK)
def assign_roster(
    request: AssignWeekRequest,
    payload: dict = Depends(get_current_user_payload),
    db: Session = Depends(get_db),
):
    if _role(payload) != UserRole.ADMIN.value:
        raise HTTPException(status_code=403, detail="Only administrators can assign staff duties.")

    staff_list = db.scalars(select(Staff).options(joinedload(Staff.user), joinedload(Staff.department)).order_by(Staff.id)).all()
    if not staff_list:
        raise HTTPException(status_code=404, detail="No staff profiles exist to assign.")

    end_date = request.start_date + timedelta(days=request.days - 1)
    existing = db.scalars(
        select(StaffDutyAssignment).where(
            StaffDutyAssignment.duty_date >= request.start_date,
            StaffDutyAssignment.duty_date <= end_date,
        )
    ).all()
    by_key = {(item.staff_id, item.duty_date): item for item in existing}
    assigned_by = _user_id(payload)

    try:
        for day_index in range(request.days):
            duty_day = request.start_date + timedelta(days=day_index)
            for staff_index, staff in enumerate(staff_list):
                # Rotate shifts by staff and day so coverage is spread across all three shifts.
                shift_name, start_time, end_time = SHIFTS[(staff_index + day_index) % len(SHIFTS)]
                item = by_key.get((staff.id, duty_day))
                if item is None:
                    item = StaffDutyAssignment(staff_id=staff.id, duty_date=duty_day)
                    db.add(item)
                    by_key[(staff.id, duty_day)] = item
                item.shift = shift_name
                item.start_time = start_time
                item.end_time = end_time
                item.status = "scheduled"
                item.notes = "Auto-assigned roster; administrator may adjust after review."
                item.assigned_by_user_id = assigned_by
        db.commit()
    except Exception:
        db.rollback()
        raise

    rows = db.execute(
        _rows_query().where(
            StaffDutyAssignment.duty_date >= request.start_date,
            StaffDutyAssignment.duty_date <= end_date,
        ).order_by(StaffDutyAssignment.duty_date, StaffDutyAssignment.shift, Staff.employee_id)
    ).all()
    return [_serialize(*row) for row in rows]


@router.patch("/{assignment_id}", response_model=StaffDutyAssignmentResponse)
def update_duty(
    assignment_id: int,
    request: UpdateStaffDutyRequest,
    payload: dict = Depends(get_current_user_payload),
    db: Session = Depends(get_db),
):
    """Allow administrators to change a single staff duty assignment."""
    if _role(payload) != UserRole.ADMIN.value:
        raise HTTPException(status_code=403, detail="Only administrators can change staff duty assignments.")

    item = db.get(StaffDutyAssignment, assignment_id)
    if item is None:
        raise HTTPException(status_code=404, detail="Duty assignment not found.")

    item.duty_date = request.duty_date
    item.shift = request.shift
    item.start_time = request.start_time
    item.end_time = request.end_time
    item.status = request.status
    item.notes = request.notes
    item.assigned_by_user_id = _user_id(payload)

    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="This staff member already has a duty assignment on the selected date. Edit that assignment instead.",
        ) from exc

    row = db.execute(_rows_query().where(StaffDutyAssignment.id == assignment_id)).one_or_none()
    if row is None:
        raise HTTPException(status_code=404, detail="Updated duty assignment could not be reloaded.")
    return _serialize(*row)
