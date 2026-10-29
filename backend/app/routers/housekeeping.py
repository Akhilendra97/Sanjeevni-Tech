from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.schemas.housekeeping import (
    HousekeepingCreate,
    HousekeepingResponse,
    HousekeepingUpdate,
)
from app.services.housekeeping_service import (
    create_housekeeping_task,
    delete_housekeeping_task,
    get_housekeeping_by_number,
    get_housekeeping_task,
    list_housekeeping_tasks,
    update_housekeeping_task,
)


router = APIRouter(
    prefix="/housekeeping",
    tags=["Housekeeping"],
)


@router.post(
    "",
    response_model=HousekeepingResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_task(
    data: HousekeepingCreate,
    db: AsyncSession = Depends(get_db),
):
    try:
        return await create_housekeeping_task(db, data)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        )


@router.get(
    "",
    response_model=list[HousekeepingResponse],
)
async def get_tasks(
    ward_id: int | None = Query(default=None),
    bed_id: int | None = Query(default=None),
    assigned_to: int | None = Query(default=None),
    status_value: str | None = Query(
        default=None,
        alias="status",
    ),
    priority: str | None = Query(default=None),
    task_type: str | None = Query(default=None),
    db: AsyncSession = Depends(get_db),
):
    return await list_housekeeping_tasks(
        db=db,
        ward_id=ward_id,
        bed_id=bed_id,
        assigned_to=assigned_to,
        status=status_value,
        priority=priority,
        task_type=task_type,
    )


@router.get(
    "/number/{task_number}",
    response_model=HousekeepingResponse,
)
async def get_task_by_number(
    task_number: str,
    db: AsyncSession = Depends(get_db),
):
    task = await get_housekeeping_by_number(
        db,
        task_number,
    )

    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Housekeeping task not found",
        )

    return task


@router.get(
    "/{task_id}",
    response_model=HousekeepingResponse,
)
async def get_task(
    task_id: int,
    db: AsyncSession = Depends(get_db),
):
    task = await get_housekeeping_task(
        db,
        task_id,
    )

    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Housekeeping task not found",
        )

    return task


@router.put(
    "/{task_id}",
    response_model=HousekeepingResponse,
)
async def update_task(
    task_id: int,
    data: HousekeepingUpdate,
    db: AsyncSession = Depends(get_db),
):
    try:
        task = await update_housekeeping_task(
            db,
            task_id,
            data,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        )

    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Housekeeping task not found",
        )

    return task


@router.delete(
    "/{task_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_task(
    task_id: int,
    db: AsyncSession = Depends(get_db),
):
    deleted = await delete_housekeeping_task(
        db,
        task_id,
    )

    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Housekeeping task not found",
        )

    return None
