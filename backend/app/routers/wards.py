from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.ward import (
    WardCreate,
    WardResponse,
    WardUpdate,
)
from app.services.ward_service import (
    create_ward,
    delete_ward,
    get_ward_by_id,
    list_wards,
    update_ward,
)

router = APIRouter(
    prefix="/wards",
    tags=["Wards"],
)


@router.post(
    "",
    response_model=WardResponse,
    status_code=status.HTTP_201_CREATED,
)
def create(
    request: WardCreate,
    db: Session = Depends(get_db),
):
    try:
        return create_ward(
            db,
            request,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc


@router.get(
    "",
    response_model=list[WardResponse],
)
def get_all(
    db: Session = Depends(get_db),
):
    return list_wards(db)


@router.get(
    "/{ward_id}",
    response_model=WardResponse,
)
def get_one(
    ward_id: int,
    db: Session = Depends(get_db),
):
    ward = get_ward_by_id(
        db,
        ward_id,
    )

    if ward is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ward not found.",
        )

    return ward


@router.patch(
    "/{ward_id}",
    response_model=WardResponse,
)
def update(
    ward_id: int,
    request: WardUpdate,
    db: Session = Depends(get_db),
):
    ward = get_ward_by_id(
        db,
        ward_id,
    )

    if ward is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ward not found.",
        )

    try:
        return update_ward(
            db,
            ward,
            request,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc


@router.delete(
    "/{ward_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete(
    ward_id: int,
    db: Session = Depends(get_db),
):
    ward = get_ward_by_id(
        db,
        ward_id,
    )

    if ward is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ward not found.",
        )

    delete_ward(
        db,
        ward,
    )