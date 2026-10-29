from datetime import date

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.diet import (
    DietCreate,
    DietResponse,
    DietUpdate,
)
from app.services.diet_service import (
    create_diet,
    delete_diet,
    get_diet,
    list_diets,
    update_diet,
)

router = APIRouter(
    prefix="/diets",
    tags=["Diet Management"],
)


@router.post(
    "",
    response_model=DietResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_diet_record(
    diet_data: DietCreate,
    db: Session = Depends(get_db),
):
    return create_diet(
        db=db,
        diet_data=diet_data,
    )


@router.get(
    "",
    response_model=list[DietResponse],
)
def get_diet_records(
    patient_id: int | None = Query(
        default=None,
        gt=0,
    ),
    diet_date: date | None = None,
    diet_type: str | None = None,
    db: Session = Depends(get_db),
):
    return list_diets(
        db=db,
        patient_id=patient_id,
        diet_date=diet_date,
        diet_type=diet_type,
    )


@router.get(
    "/{diet_id}",
    response_model=DietResponse,
)
def get_diet_record(
    diet_id: int,
    db: Session = Depends(get_db),
):
    return get_diet(
        db=db,
        diet_id=diet_id,
    )


@router.put(
    "/{diet_id}",
    response_model=DietResponse,
)
def update_diet_record(
    diet_id: int,
    diet_data: DietUpdate,
    db: Session = Depends(get_db),
):
    return update_diet(
        db=db,
        diet_id=diet_id,
        diet_data=diet_data,
    )


@router.delete(
    "/{diet_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_diet_record(
    diet_id: int,
    db: Session = Depends(get_db),
):
    delete_diet(
        db=db,
        diet_id=diet_id,
    )
    return None
