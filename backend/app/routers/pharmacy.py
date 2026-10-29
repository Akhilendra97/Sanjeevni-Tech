from app.core.dependencies import require_permission
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.pharmacy import (
    PharmacyCreate,
    PharmacyResponse,
    PharmacyUpdate,
)
from app.services import pharmacy_service


router = APIRouter(
    prefix="/pharmacies",
    tags=["Pharmacy Management"],
)


@router.post(
    "",
    response_model=PharmacyResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_permission("pharmacy.manage"))],
)
def create_pharmacy(
    pharmacy_data: PharmacyCreate,
    db: Session = Depends(get_db),
):
    try:
        return pharmacy_service.create_pharmacy(
            db,
            pharmacy_data,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        )


@router.get(
    "",
    response_model=list[PharmacyResponse],
    dependencies=[Depends(require_permission("pharmacy.view"))],
)
def list_pharmacies(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=500),
    status_filter: str | None = Query(
        default=None,
        alias="status",
    ),
    pharmacy_type: str | None = None,
    department_id: int | None = None,
    db: Session = Depends(get_db),
):
    try:
        return pharmacy_service.list_pharmacies(
            db=db,
            skip=skip,
            limit=limit,
            status=status_filter,
            pharmacy_type=pharmacy_type,
            department_id=department_id,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        )


@router.get(
    "/number/{pharmacy_number}",
    response_model=PharmacyResponse,
    dependencies=[Depends(require_permission("pharmacy.view"))],
)
def get_pharmacy_by_number(
    pharmacy_number: str,
    db: Session = Depends(get_db),
):
    pharmacy = pharmacy_service.get_pharmacy_by_number(
        db,
        pharmacy_number,
    )

    if pharmacy is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pharmacy not found",
        )

    return pharmacy


@router.get(
    "/{pharmacy_id}",
    response_model=PharmacyResponse,
    dependencies=[Depends(require_permission("pharmacy.view"))],
)
def get_pharmacy(
    pharmacy_id: int,
    db: Session = Depends(get_db),
):
    pharmacy = pharmacy_service.get_pharmacy(
        db,
        pharmacy_id,
    )

    if pharmacy is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pharmacy not found",
        )

    return pharmacy


@router.put(
    "/{pharmacy_id}",
    response_model=PharmacyResponse,
    dependencies=[Depends(require_permission("pharmacy.manage"))],
)
def update_pharmacy(
    pharmacy_id: int,
    pharmacy_data: PharmacyUpdate,
    db: Session = Depends(get_db),
):
    try:
        pharmacy = pharmacy_service.update_pharmacy(
            db,
            pharmacy_id,
            pharmacy_data,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        )

    if pharmacy is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pharmacy not found",
        )

    return pharmacy


@router.patch(
    "/{pharmacy_id}/activate",
    response_model=PharmacyResponse,
    dependencies=[Depends(require_permission("pharmacy.manage"))],
)
def activate_pharmacy(
    pharmacy_id: int,
    db: Session = Depends(get_db),
):
    pharmacy = pharmacy_service.activate_pharmacy(
        db,
        pharmacy_id,
    )

    if pharmacy is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pharmacy not found",
        )

    return pharmacy


@router.patch(
    "/{pharmacy_id}/deactivate",
    response_model=PharmacyResponse,
    dependencies=[Depends(require_permission("pharmacy.manage"))],
)
def deactivate_pharmacy(
    pharmacy_id: int,
    db: Session = Depends(get_db),
):
    pharmacy = pharmacy_service.deactivate_pharmacy(
        db,
        pharmacy_id,
    )

    if pharmacy is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pharmacy not found",
        )

    return pharmacy


@router.delete(
    "/{pharmacy_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(require_permission("pharmacy.manage"))],
)
def delete_pharmacy(
    pharmacy_id: int,
    db: Session = Depends(get_db),
):
    deleted = pharmacy_service.delete_pharmacy(
        db,
        pharmacy_id,
    )

    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pharmacy not found",
        )

    return None
