from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.constants import UserRole
from app.core.database import get_db
from app.core.dependencies import require_role
from app.models.department import Department
from app.schemas.department import (
    DepartmentCreate,
    DepartmentResponse,
    DepartmentUpdate,
)
from app.services.department_service import (
    create_department,
    delete_department,
    get_department_by_id,
    get_departments,
    update_department,
)


router = APIRouter(
    prefix="/departments",
    tags=["Departments"],
)


@router.post(
    "",
    response_model=DepartmentResponse,
    status_code=status.HTTP_201_CREATED,
)
def create(
    request: DepartmentCreate,
    db: Session = Depends(get_db),
    _: dict = Depends(require_role(UserRole.ADMIN)),
) -> Department:

    try:
        return create_department(
            db,
            name=request.name,
            code=request.code,
            description=request.description,
            location=request.location,
            contact_number=request.contact_number,
        )

    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc


@router.get(
    "",
    response_model=list[DepartmentResponse],
)
def list_all(
    active_only: bool = Query(
        default=False,
    ),
    db: Session = Depends(get_db),
    _: dict = Depends(
        require_role(
            UserRole.ADMIN,
            UserRole.DOCTOR,
            UserRole.NURSE,
            UserRole.RECEPTIONIST,
        )
    ),
) -> list[Department]:

    return get_departments(
        db,
        active_only=active_only,
    )


@router.get(
    "/{department_id}",
    response_model=DepartmentResponse,
)
def get_one(
    department_id: int,
    db: Session = Depends(get_db),
    _: dict = Depends(
        require_role(
            UserRole.ADMIN,
            UserRole.DOCTOR,
            UserRole.NURSE,
            UserRole.RECEPTIONIST,
        )
    ),
) -> Department:

    department = get_department_by_id(
        db,
        department_id,
    )

    if department is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Department not found.",
        )

    return department


@router.patch(
    "/{department_id}",
    response_model=DepartmentResponse,
)
def update(
    department_id: int,
    request: DepartmentUpdate,
    db: Session = Depends(get_db),
    _: dict = Depends(require_role(UserRole.ADMIN)),
) -> Department:

    department = get_department_by_id(
        db,
        department_id,
    )

    if department is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Department not found.",
        )

    try:
        return update_department(
            db,
            department,
            name=request.name,
            code=request.code,
            description=request.description,
            location=request.location,
            contact_number=request.contact_number,
            is_active=request.is_active,
        )

    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc


@router.delete(
    "/{department_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete(
    department_id: int,
    db: Session = Depends(get_db),
    _: dict = Depends(require_role(UserRole.ADMIN)),
) -> None:

    department = get_department_by_id(
        db,
        department_id,
    )

    if department is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Department not found.",
        )

    try:
        delete_department(
            db,
            department,
        )

    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc
