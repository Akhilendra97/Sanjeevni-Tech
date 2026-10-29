from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.core.database import get_db
from app.core.dependencies import get_current_user_payload
from app.models.staff import Staff
from app.schemas.staff import StaffResponse

router = APIRouter(prefix="/staff", tags=["Staff Self-Service"])


@router.get("/me", response_model=StaffResponse)
def get_my_staff_profile(
    payload: dict = Depends(get_current_user_payload),
    db: Session = Depends(get_db),
):
    try:
        user_id = int(payload.get("sub"))
    except (TypeError, ValueError):
        raise HTTPException(status_code=401, detail="Invalid authenticated user.")

    staff = db.scalar(
        select(Staff)
        .options(selectinload(Staff.user), selectinload(Staff.department))
        .where(Staff.user_id == user_id)
    )
    if staff is None:
        raise HTTPException(status_code=404, detail="No staff profile is linked to this account.")
    return staff
