from app.core.dependencies import require_permission
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.inventory_batch import (
    InventoryBatchCreate,
    InventoryBatchQuantityAdjustment,
    InventoryBatchReservation,
    InventoryBatchResponse,
    InventoryBatchUpdate,
)
from app.services.inventory_batch_service import (
    adjust_inventory_batch_quantity,
    create_inventory_batch,
    delete_inventory_batch,
    get_batches_by_medicine,
    get_inventory_batch_by_id,
    list_expired_batches,
    list_expiring_batches,
    list_inventory_batches,
    release_inventory_batch,
    reserve_inventory_batch,
    update_inventory_batch,
)


router = APIRouter(
    prefix="/inventory-batches",
    tags=["Pharmacy - Inventory Batches"],
)


def _service_error(error: ValueError) -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail=str(error),
    )


@router.post(
    "",
    response_model=InventoryBatchResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_permission("inventory.manage"))],
)
def create_batch(
    data: InventoryBatchCreate,
    db: Session = Depends(get_db),
):
    try:
        batch = create_inventory_batch(
            db,
            data,
        )

        db.commit()
        db.refresh(batch)

        return batch

    except ValueError as exc:
        db.rollback()
        raise _service_error(exc)


@router.get(
    "",
    response_model=list[InventoryBatchResponse],
    dependencies=[Depends(require_permission("inventory.view"))],
)
def get_batches(
    medicine_id: int | None = Query(
        default=None,
        gt=0,
    ),
    batch_status: str | None = Query(
        default=None,
        alias="status",
    ),
    include_expired: bool = True,
    db: Session = Depends(get_db),
):
    return list_inventory_batches(
        db,
        medicine_id=medicine_id,
        status=batch_status,
        include_expired=include_expired,
    )


@router.get(
    "/medicine/{medicine_id}",
    response_model=list[InventoryBatchResponse],
    dependencies=[Depends(require_permission("inventory.view"))],
)
def get_medicine_batches(
    medicine_id: int,
    db: Session = Depends(get_db),
):
    return get_batches_by_medicine(
        db,
        medicine_id,
    )


@router.get(
    "/expiring",
    response_model=list[InventoryBatchResponse],
    dependencies=[Depends(require_permission("inventory.view"))],
)
def get_expiring_batches(
    days: int = Query(
        default=30,
        ge=0,
        le=3650,
    ),
    db: Session = Depends(get_db),
):
    return list_expiring_batches(
        db,
        days=days,
    )


@router.get(
    "/expired",
    response_model=list[InventoryBatchResponse],
    dependencies=[Depends(require_permission("inventory.view"))],
)
def get_expired_batches(
    db: Session = Depends(get_db),
):
    try:
        batches = list_expired_batches(db)
        db.commit()

        return batches

    except ValueError as exc:
        db.rollback()
        raise _service_error(exc)


@router.get(
    "/{batch_id}",
    response_model=InventoryBatchResponse,
    dependencies=[Depends(require_permission("inventory.view"))],
)
def get_batch(
    batch_id: int,
    db: Session = Depends(get_db),
):
    batch = get_inventory_batch_by_id(
        db,
        batch_id,
    )

    if batch is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Inventory batch not found.",
        )

    return batch


@router.put(
    "/{batch_id}",
    response_model=InventoryBatchResponse,
    dependencies=[Depends(require_permission("inventory.manage"))],
)
def update_batch(
    batch_id: int,
    data: InventoryBatchUpdate,
    db: Session = Depends(get_db),
):
    try:
        batch = update_inventory_batch(
            db,
            batch_id,
            data,
        )

        db.commit()
        db.refresh(batch)

        return batch

    except ValueError as exc:
        db.rollback()
        raise _service_error(exc)


@router.patch(
    "/{batch_id}/adjust",
    response_model=InventoryBatchResponse,
    dependencies=[Depends(require_permission("inventory.manage"))],
)
def adjust_batch_quantity(
    batch_id: int,
    data: InventoryBatchQuantityAdjustment,
    db: Session = Depends(get_db),
):
    try:
        batch = adjust_inventory_batch_quantity(
            db,
            batch_id,
            data,
        )

        db.commit()
        db.refresh(batch)

        return batch

    except ValueError as exc:
        db.rollback()
        raise _service_error(exc)


@router.patch(
    "/{batch_id}/reserve",
    response_model=InventoryBatchResponse,
    dependencies=[Depends(require_permission("inventory.manage"))],
)
def reserve_batch(
    batch_id: int,
    data: InventoryBatchReservation,
    db: Session = Depends(get_db),
):
    try:
        batch = reserve_inventory_batch(
            db,
            batch_id,
            data,
        )

        db.commit()
        db.refresh(batch)

        return batch

    except ValueError as exc:
        db.rollback()
        raise _service_error(exc)


@router.patch(
    "/{batch_id}/release",
    response_model=InventoryBatchResponse,
    dependencies=[Depends(require_permission("inventory.manage"))],
)
def release_batch(
    batch_id: int,
    data: InventoryBatchReservation,
    db: Session = Depends(get_db),
):
    try:
        batch = release_inventory_batch(
            db,
            batch_id,
            data,
        )

        db.commit()
        db.refresh(batch)

        return batch

    except ValueError as exc:
        db.rollback()
        raise _service_error(exc)


@router.delete(
    "/{batch_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(require_permission("inventory.manage"))],
)
def delete_batch(
    batch_id: int,
    db: Session = Depends(get_db),
):
    try:
        delete_inventory_batch(
            db,
            batch_id,
        )

        db.commit()

    except ValueError as exc:
        db.rollback()
        raise _service_error(exc)

    return None
