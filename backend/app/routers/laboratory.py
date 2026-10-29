from app.core.dependencies import require_permission
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.laboratory import (
    LabCreate,
    LabResponse,
    LabUpdate,
)
from app.services.laboratory_service import (
    create_lab,
    delete_lab,
    get_lab_by_id,
    list_labs,
    update_lab,
)

router = APIRouter(
    prefix="/laboratories",
    tags=["Laboratories"],
)


@router.post(
    "",
    response_model=LabResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_permission("laboratory.manage"))],
)
def create_laboratory(
    data: LabCreate,
    db: Session = Depends(get_db),
):
    try:
        return create_lab(db, data)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(exc),
        ) from exc


@router.get(
    "",
    response_model=list[LabResponse],
    dependencies=[Depends(require_permission("laboratory.view"))],
)
def get_laboratories(
    db: Session = Depends(get_db),
):
    return list_labs(db)


@router.get(
    "/{lab_id}",
    response_model=LabResponse,
    dependencies=[Depends(require_permission("laboratory.view"))],
)
def get_laboratory(
    lab_id: int,
    db: Session = Depends(get_db),
):
    lab = get_lab_by_id(db, lab_id)

    if lab is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Laboratory not found.",
        )

    return lab


@router.patch(
    "/{lab_id}",
    response_model=LabResponse,
    dependencies=[Depends(require_permission("laboratory.manage"))],
)
def update_laboratory(
    lab_id: int,
    data: LabUpdate,
    db: Session = Depends(get_db),
):
    lab = get_lab_by_id(db, lab_id)

    if lab is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Laboratory not found.",
        )

    try:
        return update_lab(db, lab, data)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(exc),
        ) from exc


@router.delete(
    "/{lab_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(require_permission("laboratory.manage"))],
)
def delete_laboratory(
    lab_id: int,
    db: Session = Depends(get_db),
):
    lab = get_lab_by_id(db, lab_id)

    if lab is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Laboratory not found.",
        )

    delete_lab(db, lab)