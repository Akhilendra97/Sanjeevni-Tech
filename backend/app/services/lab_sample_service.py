from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.lab_sample import LabSample
from app.schemas.lab_sample import (
    LabSampleCreate,
    LabSampleUpdate,
)


def create_lab_sample(
    db: Session,
    data: LabSampleCreate,
) -> LabSample:
    existing = db.scalar(
        select(LabSample).where(
            LabSample.sample_number == data.sample_number
        )
    )

    if existing:
        raise ValueError(
            "A laboratory sample with this number already exists."
        )

    sample = LabSample(**data.model_dump())

    db.add(sample)
    db.commit()
    db.refresh(sample)

    return sample


def get_lab_sample_by_id(
    db: Session,
    sample_id: int,
) -> LabSample | None:
    return db.get(LabSample, sample_id)


def list_lab_samples(
    db: Session,
) -> list[LabSample]:
    statement = select(LabSample).order_by(
        LabSample.id.desc()
    )

    return list(
        db.scalars(statement).all()
    )


def update_lab_sample(
    db: Session,
    sample: LabSample,
    data: LabSampleUpdate,
) -> LabSample:
    updates = data.model_dump(
        exclude_unset=True,
    )

    if "sample_number" in updates:
        existing = db.scalar(
            select(LabSample).where(
                LabSample.sample_number
                == updates["sample_number"],
                LabSample.id != sample.id,
            )
        )

        if existing:
            raise ValueError(
                "A laboratory sample with this number already exists."
            )

    for field, value in updates.items():
        setattr(sample, field, value)

    db.commit()
    db.refresh(sample)

    return sample


def delete_lab_sample(
    db: Session,
    sample: LabSample,
) -> None:
    db.delete(sample)
    db.commit()