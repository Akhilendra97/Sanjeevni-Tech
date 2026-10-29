from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.lab import Lab
from app.schemas.laboratory import LabCreate, LabUpdate


def create_lab(
    db: Session,
    data: LabCreate,
) -> Lab:
    existing = db.scalar(
        select(Lab).where(
            (Lab.name == data.name) |
            (Lab.code == data.code)
        )
    )

    if existing:
        raise ValueError(
            "Laboratory with the same name or code already exists."
        )

    lab = Lab(**data.model_dump())

    db.add(lab)
    db.commit()
    db.refresh(lab)

    return lab


def get_lab_by_id(
    db: Session,
    lab_id: int,
) -> Lab | None:
    return db.get(Lab, lab_id)


def list_labs(
    db: Session,
) -> list[Lab]:
    statement = select(Lab).order_by(Lab.id.desc())

    return list(
        db.scalars(statement).all()
    )


def update_lab(
    db: Session,
    lab: Lab,
    data: LabUpdate,
) -> Lab:
    updates = data.model_dump(
        exclude_unset=True,
    )

    if "name" in updates or "code" in updates:
        existing = db.scalar(
            select(Lab).where(
                (
                    (Lab.name == updates.get("name"))
                    if "name" in updates
                    else False
                )
                |
                (
                    (Lab.code == updates.get("code"))
                    if "code" in updates
                    else False
                ),
                Lab.id != lab.id,
            )
        )

        if existing:
            raise ValueError(
                "Another laboratory with the same name or code already exists."
            )

    for field, value in updates.items():
        setattr(lab, field, value)

    db.commit()
    db.refresh(lab)

    return lab


def delete_lab(
    db: Session,
    lab: Lab,
) -> None:
    db.delete(lab)
    db.commit()