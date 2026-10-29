from app.core.dependencies import require_permission
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.inventory import Inventory
from app.schemas.inventory import (
    InventoryCreate,
    InventoryQuantityAdjustment,
    InventoryReservation,
    InventoryResponse,
    InventoryUpdate,
)
from app.services.inventory_service import (
    adjust_inventory_quantity,
    create_inventory,
    delete_inventory,
    get_inventory_by_id,
    get_inventory_by_medicine,
    list_available_inventory,
    list_inventory,
    list_low_stock_inventory,
    release_inventory,
    reserve_inventory,
    update_inventory,
)


router = APIRouter(
    prefix="/inventory",
    tags=["Pharmacy - Inventory"],
)


def _service_error(exc: ValueError) -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail=str(exc),
    )


@router.post(
    "",
    response_model=InventoryResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_permission("inventory.manage"))],
)
def create(
    data: InventoryCreate,
    db: Session = Depends(get_db),
) -> Inventory:
    try:
        return create_inventory(db, data)
    except ValueError as exc:
        raise _service_error(exc)


@router.get(
    "",
    response_model=list[InventoryResponse],
    dependencies=[Depends(require_permission("inventory.view"))],
)
def list_all(
    db: Session = Depends(get_db),
) -> list[Inventory]:
    return list_inventory(db)


@router.get(
    "/low-stock",
    response_model=list[InventoryResponse],
    dependencies=[Depends(require_permission("inventory.view"))],
)
def low_stock(
    db: Session = Depends(get_db),
) -> list[Inventory]:
    return list_low_stock_inventory(db)


@router.get(
    "/available",
    response_model=list[InventoryResponse],
    dependencies=[Depends(require_permission("inventory.view"))],
)
def available(
    db: Session = Depends(get_db),
) -> list[Inventory]:
    return list_available_inventory(db)


@router.get(
    "/medicine/{medicine_id}",
    response_model=InventoryResponse,
    dependencies=[Depends(require_permission("inventory.view"))],
)
def by_medicine(
    medicine_id: int,
    db: Session = Depends(get_db),
) -> Inventory:
    inventory = get_inventory_by_medicine(
        db,
        medicine_id,
    )

    if inventory is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Inventory not found for this medicine.",
        )

    return inventory


@router.get(
    "/{inventory_id}",
    response_model=InventoryResponse,
    dependencies=[Depends(require_permission("inventory.view"))],
)
def get_one(
    inventory_id: int,
    db: Session = Depends(get_db),
) -> Inventory:
    inventory = get_inventory_by_id(
        db,
        inventory_id,
    )

    if inventory is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Inventory not found.",
        )

    return inventory


@router.put(
    "/{inventory_id}",
    response_model=InventoryResponse,
    dependencies=[Depends(require_permission("inventory.manage"))],
)
def update(
    inventory_id: int,
    data: InventoryUpdate,
    db: Session = Depends(get_db),
) -> Inventory:
    inventory = get_inventory_by_id(
        db,
        inventory_id,
    )

    if inventory is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Inventory not found.",
        )

    try:
        return update_inventory(
            db,
            inventory,
            data,
        )
    except ValueError as exc:
        raise _service_error(exc)


@router.patch(
    "/{inventory_id}/adjust",
    response_model=InventoryResponse,
    dependencies=[Depends(require_permission("inventory.manage"))],
)
def adjust(
    inventory_id: int,
    data: InventoryQuantityAdjustment,
    db: Session = Depends(get_db),
) -> Inventory:
    inventory = get_inventory_by_id(
        db,
        inventory_id,
    )

    if inventory is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Inventory not found.",
        )

    try:
        return adjust_inventory_quantity(
            db,
            inventory,
            data.quantity_change,
        )
    except ValueError as exc:
        raise _service_error(exc)


@router.patch(
    "/{inventory_id}/reserve",
    response_model=InventoryResponse,
    dependencies=[Depends(require_permission("inventory.manage"))],
)
def reserve(
    inventory_id: int,
    data: InventoryReservation,
    db: Session = Depends(get_db),
) -> Inventory:
    inventory = get_inventory_by_id(
        db,
        inventory_id,
    )

    if inventory is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Inventory not found.",
        )

    try:
        return reserve_inventory(
            db,
            inventory,
            data.quantity,
        )
    except ValueError as exc:
        raise _service_error(exc)


@router.patch(
    "/{inventory_id}/release",
    response_model=InventoryResponse,
    dependencies=[Depends(require_permission("inventory.manage"))],
)
def release(
    inventory_id: int,
    data: InventoryReservation,
    db: Session = Depends(get_db),
) -> Inventory:
    inventory = get_inventory_by_id(
        db,
        inventory_id,
    )

    if inventory is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Inventory not found.",
        )

    try:
        return release_inventory(
            db,
            inventory,
            data.quantity,
        )
    except ValueError as exc:
        raise _service_error(exc)


@router.delete(
    "/{inventory_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(require_permission("inventory.manage"))],
)
def delete(
    inventory_id: int,
    db: Session = Depends(get_db),
) -> None:
    inventory = get_inventory_by_id(
        db,
        inventory_id,
    )

    if inventory is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Inventory not found.",
        )

    delete_inventory(
        db,
        inventory,
    )
