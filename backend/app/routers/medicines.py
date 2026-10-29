from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.medicine import Medicine
from app.schemas.medicine import (
    MedicineCreate,
    MedicineResponse,
    MedicineUpdate,
)
from app.services.medicine_service import (
    create_medicine,
    delete_medicine,
    get_expired_medicines,
    get_low_stock_medicines,
    get_medicine_by_id,
    list_medicines,
    update_medicine,
)


router = APIRouter(
    prefix="/medicines",
    tags=["Pharmacy - Medicines"],
)


@router.post(
    "",
    response_model=MedicineResponse,
    status_code=status.HTTP_201_CREATED,
)
def create(
    medicine_data: MedicineCreate,
    db: Session = Depends(get_db),
) -> Medicine:
    return create_medicine(db, medicine_data)


@router.get(
    "",
    response_model=list[MedicineResponse],
)
def list_all(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=500),
    db: Session = Depends(get_db),
) -> list[Medicine]:
    return list_medicines(db, skip=skip, limit=limit)


@router.get(
    "/low-stock",
    response_model=list[MedicineResponse],
)
def low_stock(
    db: Session = Depends(get_db),
) -> list[Medicine]:
    return get_low_stock_medicines(db)


@router.get(
    "/expired",
    response_model=list[MedicineResponse],
)
def expired(
    db: Session = Depends(get_db),
) -> list[Medicine]:
    return get_expired_medicines(db)


@router.get(
    "/{medicine_id}",
    response_model=MedicineResponse,
)
def get_one(
    medicine_id: int,
    db: Session = Depends(get_db),
) -> Medicine:
    medicine = get_medicine_by_id(db, medicine_id)

    if medicine is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Medicine not found.",
        )

    return medicine


@router.put(
    "/{medicine_id}",
    response_model=MedicineResponse,
)
def update(
    medicine_id: int,
    medicine_data: MedicineUpdate,
    db: Session = Depends(get_db),
) -> Medicine:
    medicine = get_medicine_by_id(db, medicine_id)

    if medicine is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Medicine not found.",
        )

    return update_medicine(
        db,
        medicine,
        medicine_data,
    )


@router.delete(
    "/{medicine_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete(
    medicine_id: int,
    db: Session = Depends(get_db),
) -> None:
    medicine = get_medicine_by_id(db, medicine_id)

    if medicine is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Medicine not found.",
        )

    delete_medicine(db, medicine)