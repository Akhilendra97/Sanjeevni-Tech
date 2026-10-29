from datetime import date

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.diet import Diet
from app.models.patient import Patient
from app.models.user import User
from app.schemas.diet import DietCreate, DietUpdate


def create_diet(
    db: Session,
    diet_data: DietCreate,
) -> Diet:
    patient = db.scalar(
        select(Patient).where(
            Patient.id == diet_data.patient_id
        )
    )

    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient not found",
        )

    if diet_data.prescribed_by is not None:
        user = db.scalar(
            select(User).where(
                User.id == diet_data.prescribed_by
            )
        )

        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Prescribing user not found",
            )

    diet = Diet(
        patient_id=diet_data.patient_id,
        prescribed_by=diet_data.prescribed_by,
        diet_type=diet_data.diet_type,
        meal_type=diet_data.meal_type,
        diet_date=diet_data.diet_date,
        calories=diet_data.calories,
        instructions=diet_data.instructions,
        restrictions=diet_data.restrictions,
        notes=diet_data.notes,
    )

    db.add(diet)
    db.commit()
    db.refresh(diet)

    return diet


def get_diet(
    db: Session,
    diet_id: int,
) -> Diet:
    diet = db.scalar(
        select(Diet).where(
            Diet.id == diet_id
        )
    )

    if not diet:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Diet record not found",
        )

    return diet


def list_diets(
    db: Session,
    patient_id: int | None = None,
    diet_date: date | None = None,
    diet_type: str | None = None,
) -> list[Diet]:
    query = select(Diet)

    if patient_id is not None:
        query = query.where(
            Diet.patient_id == patient_id
        )

    if diet_date is not None:
        query = query.where(
            Diet.diet_date == diet_date
        )

    if diet_type is not None:
        query = query.where(
            Diet.diet_type == diet_type
        )

    query = query.order_by(
        Diet.diet_date.desc(),
        Diet.id.desc(),
    )

    return list(
        db.scalars(query).all()
    )


def update_diet(
    db: Session,
    diet_id: int,
    diet_data: DietUpdate,
) -> Diet:
    diet = get_diet(db, diet_id)

    update_data = diet_data.model_dump(
        exclude_unset=True
    )

    if "patient_id" in update_data:
        patient = db.scalar(
            select(Patient).where(
                Patient.id == update_data["patient_id"]
            )
        )

        if not patient:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Patient not found",
            )

    if "prescribed_by" in update_data:
        prescribed_by = update_data["prescribed_by"]

        if prescribed_by is not None:
            user = db.scalar(
                select(User).where(
                    User.id == prescribed_by
                )
            )

            if not user:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Prescribing user not found",
                )

    for field, value in update_data.items():
        setattr(diet, field, value)

    db.commit()
    db.refresh(diet)

    return diet


def delete_diet(
    db: Session,
    diet_id: int,
) -> None:
    diet = get_diet(db, diet_id)

    db.delete(diet)
    db.commit()
