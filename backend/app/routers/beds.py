from app.core.dependencies import require_permission
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.bed import (
    BedCreate,
    BedResponse,
    BedUpdate,
)
from app.services.bed_service import (
    create_bed,
    delete_bed,
    get_bed_by_id,
    list_beds,
    update_bed,
)

router = APIRouter(
    prefix="/beds",
    tags=["Beds"],
)


@router.post(
    "",
    response_model=BedResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_permission("beds.manage"))],
)
def create(
    request: BedCreate,
    db: Session = Depends(get_db),
):
    try:
        return create_bed(
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
    response_model=list[BedResponse],
    dependencies=[Depends(require_permission("beds.view"))],
)
def get_all(
    ward_id: int | None = Query(
        default=None,
        gt=0,
    ),
    db: Session = Depends(get_db),
):
    return list_beds(
        db,
        ward_id=ward_id,
    )


@router.get(
    "/{bed_id}",
    response_model=BedResponse,
    dependencies=[Depends(require_permission("beds.view"))],
)
def get_one(
    bed_id: int,
    db: Session = Depends(get_db),
):
    bed = get_bed_by_id(
        db,
        bed_id,
    )

    if bed is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bed not found.",
        )

    return bed


@router.patch(
    "/{bed_id}",
    response_model=BedResponse,
    dependencies=[Depends(require_permission("beds.manage"))],
)
def update(
    bed_id: int,
    request: BedUpdate,
    db: Session = Depends(get_db),
):
    bed = get_bed_by_id(
        db,
        bed_id,
    )

    if bed is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bed not found.",
        )

    try:
        return update_bed(
            db,
            bed,
            request,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc


@router.delete(
    "/{bed_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(require_permission("beds.manage"))],
)
def delete(
    bed_id: int,
    db: Session = Depends(get_db),
):
    bed = get_bed_by_id(
        db,
        bed_id,
    )

    if bed is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bed not found.",
        )

    delete_bed(
        db,
        bed,
    )