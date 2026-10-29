from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.ward import Ward
from app.schemas.ward import WardCreate, WardUpdate


def create_ward(
    db: Session,
    data: WardCreate,
) -> Ward:
    existing = db.scalar(
        select(Ward).where(
            (Ward.name == data.name)
            | (Ward.code == data.code)
        )
    )

    if existing:
        raise ValueError(
            "Ward name or ward code already exists."
        )

    ward = Ward(
        name=data.name,
        code=data.code,
        ward_type=data.ward_type,
        floor=data.floor,
        location=data.location,
        description=data.description,
        capacity=data.capacity,
        is_active=data.is_active,
    )

    db.add(ward)
    db.commit()
    db.refresh(ward)

    return ward


def get_ward_by_id(
    db: Session,
    ward_id: int,
) -> Ward | None:
    return db.get(Ward, ward_id)


def list_wards(
    db: Session,
) -> list[Ward]:
    statement = (
        select(Ward)
        .order_by(Ward.id)
    )

    return list(db.scalars(statement).all())


def update_ward(
    db: Session,
    ward: Ward,
    data: WardUpdate,
) -> Ward:
    updates = data.model_dump(
        exclude_unset=True,
    )

    if "name" in updates or "code" in updates:
        existing = db.scalar(
            select(Ward).where(
                Ward.id != ward.id,
                (
                    (Ward.name == updates.get("name", ward.name))
                    | (Ward.code == updates.get("code", ward.code))
                ),
            )
        )

        if existing:
            raise ValueError(
                "Ward name or ward code already exists."
            )

    for field, value in updates.items():
        setattr(ward, field, value)

    db.commit()
    db.refresh(ward)

    return ward


def delete_ward(
    db: Session,
    ward: Ward,
) -> None:
    db.delete(ward)
    db.commit()