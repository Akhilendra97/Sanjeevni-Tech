from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.staff import Staff
from app.schemas.staff import (
    StaffCreate,
    StaffResponse,
    StaffUpdate,
)
from app.services.staff_service import (
    create_staff,
    delete_staff,
    get_staff_by_id,
    list_staff,
    update_staff,
)


router = APIRouter(
    prefix="/staff",
    tags=["Staff"],
)


@router.post(
    "",
    response_model=StaffResponse,
    status_code=status.HTTP_201_CREATED,
)
def create(
    request: StaffCreate,
    db: Session = Depends(get_db),
) -> Staff:

    try:
        return create_staff(
            db,
            user_id=request.user_id,
            full_name=request.full_name,
            username=request.username,
            email=str(request.email) if request.email else None,
            password=request.password,
            phone=request.phone,
            department_id=request.department_id,
            employee_id=request.employee_id,
            designation=request.designation,
            qualification=request.qualification,
            joining_date=request.joining_date,
            is_available=request.is_available,
        )

    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc


@router.get(
    "",
    response_model=list[StaffResponse],
)
def get_all(
    db: Session = Depends(get_db),
) -> list[Staff]:

    return list_staff(db)


@router.get(
    "/{staff_id}",
    response_model=StaffResponse,
)
def get_one(
    staff_id: int,
    db: Session = Depends(get_db),
) -> Staff:

    staff = get_staff_by_id(
        db,
        staff_id,
    )

    if staff is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Staff member not found.",
        )

    return staff


@router.patch(
    "/{staff_id}",
    response_model=StaffResponse,
)
def update(
    staff_id: int,
    request: StaffUpdate,
    db: Session = Depends(get_db),
) -> Staff:

    staff = get_staff_by_id(
        db,
        staff_id,
    )

    if staff is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Staff member not found.",
        )

    try:
        return update_staff(
            db,
            staff,
            user_id=request.user_id,
            full_name=request.full_name,
            email=str(request.email) if request.email else None,
            phone=request.phone,
            department_id=request.department_id,
            employee_id=request.employee_id,
            designation=request.designation,
            qualification=request.qualification,
            joining_date=request.joining_date,
            is_available=request.is_available,
        )

    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc


@router.delete(
    "/{staff_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete(
    staff_id: int,
    db: Session = Depends(get_db),
) -> None:

    staff = get_staff_by_id(
        db,
        staff_id,
    )

    if staff is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Staff member not found.",
        )

    delete_staff(
        db,
        staff,
    )