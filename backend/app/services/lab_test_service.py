from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.lab_test import LabTest
from app.schemas.lab_test import LabTestCreate, LabTestUpdate


def create_lab_test(
    db: Session,
    data: LabTestCreate,
) -> LabTest:
    existing = db.scalar(
        select(LabTest).where(
            LabTest.test_code == data.test_code
        )
    )

    if existing:
        raise ValueError(
            "A laboratory test with this code already exists."
        )

    lab_test = LabTest(**data.model_dump())

    db.add(lab_test)
    db.commit()
    db.refresh(lab_test)

    return lab_test


def get_lab_test_by_id(
    db: Session,
    test_id: int,
) -> LabTest | None:
    return db.get(LabTest, test_id)


def list_lab_tests(
    db: Session,
) -> list[LabTest]:
    statement = select(LabTest).order_by(
        LabTest.id.desc()
    )

    return list(
        db.scalars(statement).all()
    )


def update_lab_test(
    db: Session,
    lab_test: LabTest,
    data: LabTestUpdate,
) -> LabTest:
    updates = data.model_dump(
        exclude_unset=True,
    )

    if "test_code" in updates:
        existing = db.scalar(
            select(LabTest).where(
                LabTest.test_code == updates["test_code"],
                LabTest.id != lab_test.id,
            )
        )

        if existing:
            raise ValueError(
                "A laboratory test with this code already exists."
            )

    for field, value in updates.items():
        setattr(lab_test, field, value)

    db.commit()
    db.refresh(lab_test)

    return lab_test


def delete_lab_test(
    db: Session,
    lab_test: LabTest,
) -> None:
    db.delete(lab_test)
    db.commit()