from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.bed import Bed
from app.models.housekeeping import Housekeeping
from app.models.staff import Staff
from app.models.ward import Ward
from app.schemas.housekeeping import (
    HousekeepingCreate,
    HousekeepingUpdate,
)


async def create_housekeeping_task(
    db: Session,
    data: HousekeepingCreate,
) -> Housekeeping:
    existing = db.scalar(
        select(Housekeeping).where(
            Housekeeping.task_number == data.task_number
        )
    )

    if existing:
        raise ValueError("Housekeeping task number already exists")

    ward = db.get(Ward, data.ward_id)

    if not ward:
        raise ValueError("Ward not found")

    if data.bed_id is not None:
        bed = db.get(Bed, data.bed_id)

        if not bed:
            raise ValueError("Bed not found")

        if bed.ward_id != data.ward_id:
            raise ValueError("Bed does not belong to the selected ward")

    if data.assigned_to is not None:
        staff = db.get(Staff, data.assigned_to)

        if not staff:
            raise ValueError("Assigned staff member not found")

    task = Housekeeping(
        **data.model_dump(),
    )

    db.add(task)
    db.commit()
    db.refresh(task)

    return task


async def get_housekeeping_task(
    db: Session,
    task_id: int,
) -> Housekeeping | None:
    return db.get(Housekeeping, task_id)


async def get_housekeeping_by_number(
    db: Session,
    task_number: str,
) -> Housekeeping | None:
    return db.scalar(
        select(Housekeeping).where(
            Housekeeping.task_number == task_number
        )
    )


async def list_housekeeping_tasks(
    db: Session,
    ward_id: int | None = None,
    bed_id: int | None = None,
    assigned_to: int | None = None,
    status: str | None = None,
    priority: str | None = None,
    task_type: str | None = None,
) -> list[Housekeeping]:
    query = select(Housekeeping)

    if ward_id is not None:
        query = query.where(
            Housekeeping.ward_id == ward_id
        )

    if bed_id is not None:
        query = query.where(
            Housekeeping.bed_id == bed_id
        )

    if assigned_to is not None:
        query = query.where(
            Housekeeping.assigned_to == assigned_to
        )

    if status is not None:
        query = query.where(
            Housekeeping.status == status
        )

    if priority is not None:
        query = query.where(
            Housekeeping.priority == priority
        )

    if task_type is not None:
        query = query.where(
            Housekeeping.task_type == task_type
        )

    query = query.order_by(
        Housekeeping.scheduled_at.asc(),
        Housekeeping.created_at.desc(),
    )

    result = db.scalars(query)

    return list(result.all())


async def update_housekeeping_task(
    db: Session,
    task_id: int,
    data: HousekeepingUpdate,
) -> Housekeeping | None:
    task = db.get(Housekeeping, task_id)

    if not task:
        return None

    update_data = data.model_dump(exclude_unset=True)

    ward_id = update_data.get(
        "ward_id",
        task.ward_id,
    )

    bed_id = update_data.get(
        "bed_id",
        task.bed_id,
    )

    assigned_to = update_data.get(
        "assigned_to",
        task.assigned_to,
    )

    ward = db.get(Ward, ward_id)

    if not ward:
        raise ValueError("Ward not found")

    if bed_id is not None:
        bed = db.get(Bed, bed_id)

        if not bed:
            raise ValueError("Bed not found")

        if bed.ward_id != ward_id:
            raise ValueError("Bed does not belong to the selected ward")

    if assigned_to is not None:
        staff = db.get(Staff, assigned_to)

        if not staff:
            raise ValueError("Assigned staff member not found")

    for field, value in update_data.items():
        setattr(task, field, value)

    db.commit()
    db.refresh(task)

    return task


async def delete_housekeeping_task(
    db: Session,
    task_id: int,
) -> bool:
    task = db.get(Housekeeping, task_id)

    if not task:
        return False

    db.delete(task)
    db.commit()

    return True

