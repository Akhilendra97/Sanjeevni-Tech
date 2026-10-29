from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.bed import Bed
from app.models.ward import Ward
from app.schemas.bed import BedCreate, BedUpdate


def create_bed(
    db: Session,
    data: BedCreate,
) -> Bed:
    ward = db.get(Ward, data.ward_id)

    if ward is None:
        raise ValueError(
            "Ward not found."
        )

    existing = db.scalar(
        select(Bed).where(
            Bed.ward_id == data.ward_id,
            Bed.bed_number == data.bed_number,
        )
    )

    if existing:
        raise ValueError(
            "Bed number already exists in this ward."
        )

    bed = Bed(
        ward_id=data.ward_id,
        bed_number=data.bed_number,
        bed_type=data.bed_type,
        status=data.status,
        is_active=data.is_active,
        notes=data.notes,
    )

    db.add(bed)
    db.commit()
    db.refresh(bed)

    return bed


def get_bed_by_id(
    db: Session,
    bed_id: int,
) -> Bed | None:
    return db.get(Bed, bed_id)


def list_beds(
    db: Session,
    ward_id: int | None = None,
) -> list[Bed]:
    statement = select(Bed)

    if ward_id is not None:
        statement = statement.where(
            Bed.ward_id == ward_id
        )

    statement = statement.order_by(Bed.id)

    return list(db.scalars(statement).all())


def update_bed(
    db: Session,
    bed: Bed,
    data: BedUpdate,
) -> Bed:
    updates = data.model_dump(
        exclude_unset=True,
    )

    new_ward_id = updates.get(
        "ward_id",
        bed.ward_id,
    )

    new_bed_number = updates.get(
        "bed_number",
        bed.bed_number,
    )

    ward = db.get(
        Ward,
        new_ward_id,
    )

    if ward is None:
        raise ValueError(
            "Ward not found."
        )

    existing = db.scalar(
        select(Bed).where(
            Bed.id != bed.id,
            Bed.ward_id == new_ward_id,
            Bed.bed_number == new_bed_number,
        )
    )

    if existing:
        raise ValueError(
            "Bed number already exists in this ward."
        )

    for field, value in updates.items():
        setattr(bed, field, value)

    db.commit()
    db.refresh(bed)

    return bed


def delete_bed(
    db: Session,
    bed: Bed,
) -> None:
    db.delete(bed)
    db.commit()