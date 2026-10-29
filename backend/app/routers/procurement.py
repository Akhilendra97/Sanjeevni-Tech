from __future__ import annotations
from app.core.dependencies import require_permission

from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.purchase_order import PurchaseOrderItem
from app.models.supplier import Supplier
from app.schemas.supplier import SupplierResponse
from app.schemas.procurement import (
    PurchaseOrderCreate,
    PurchaseOrderItemResponse,
    PurchaseOrderItemUpdate,
    PurchaseOrderResponse,
    PurchaseOrderUpdate,
)
from app.services.procurement_service import (
    create_purchase_order,
    create_supplier,
    deactivate_supplier,
    delete_purchase_order,
    delete_purchase_order_item,
    get_purchase_order_by_id,
    get_purchase_order_by_number,
    get_purchase_order_item_by_id,
    get_supplier_by_id,
    list_purchase_orders,
    list_suppliers,
    update_purchase_order,
    update_purchase_order_item,
    update_purchase_order_status,
    update_supplier,
)


router = APIRouter(
    prefix="/procurement",
    tags=["Procurement"],
)


# ============================================================
# SUPPLIERS
# ============================================================

@router.post(
    "/suppliers",
    response_model=dict,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_permission("procurement.manage"))],
)
def create_supplier_endpoint(
    data: dict,
    db: Session = Depends(get_db),
):
    try:
        supplier = create_supplier(
            db=db,
            supplier_code=data["supplier_code"],
            name=data["name"],
            contact_person=data.get("contact_person"),
            phone=data.get("phone"),
            email=data.get("email"),
            address=data.get("address"),
            city=data.get("city"),
            state=data.get("state"),
            postal_code=data.get("postal_code"),
            gst_number=data.get("gst_number"),
            payment_terms=data.get("payment_terms"),
            notes=data.get("notes"),
        )

        return {
            "success": True,
            "message": "Supplier created successfully.",
            "data": supplier,
        }

    except KeyError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Missing required field: {exc.args[0]}",
        ) from exc

    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(exc),
        ) from exc


@router.get(
    "/suppliers",
    response_model=list[SupplierResponse],
    dependencies=[Depends(require_permission("procurement.view"))],
)
def get_suppliers(
    active_only: bool = False,
    db: Session = Depends(get_db),
):
    return list_suppliers(
        db,
        active_only=active_only,
    )


@router.get(
    "/suppliers/{supplier_id}",
    dependencies=[Depends(require_permission("procurement.view"))],
)
def get_supplier(
    supplier_id: int,
    db: Session = Depends(get_db),
):
    supplier = get_supplier_by_id(
        db,
        supplier_id,
    )

    if supplier is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Supplier not found.",
        )

    return supplier


@router.put(
    "/suppliers/{supplier_id}",
    dependencies=[Depends(require_permission("procurement.manage"))],
)
def update_supplier_endpoint(
    supplier_id: int,
    data: dict,
    db: Session = Depends(get_db),
):
    supplier = get_supplier_by_id(
        db,
        supplier_id,
    )

    if supplier is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Supplier not found.",
        )

    try:
        return update_supplier(
            db=db,
            supplier=supplier,
            **data,
        )

    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(exc),
        ) from exc


@router.delete(
    "/suppliers/{supplier_id}",
    dependencies=[Depends(require_permission("procurement.manage"))],
)
def deactivate_supplier_endpoint(
    supplier_id: int,
    db: Session = Depends(get_db),
):
    supplier = get_supplier_by_id(
        db,
        supplier_id,
    )

    if supplier is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Supplier not found.",
        )

    supplier = deactivate_supplier(
        db=db,
        supplier=supplier,
    )

    return {
        "success": True,
        "message": "Supplier deactivated successfully.",
        "data": supplier,
    }


# ============================================================
# PURCHASE ORDERS
# ============================================================

@router.post(
    "/purchase-orders",
    response_model=PurchaseOrderResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_permission("procurement.manage"))],
)
def create_purchase_order_endpoint(
    data: PurchaseOrderCreate,
    db: Session = Depends(get_db),
):
    try:
        return create_purchase_order(
            db=db,
            data=data,
        )

    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(exc),
        ) from exc


@router.get(
    "/purchase-orders",
    response_model=list[PurchaseOrderResponse],
    dependencies=[Depends(require_permission("procurement.view"))],
)
def get_purchase_orders(
    order_status: str | None = None,
    db: Session = Depends(get_db),
):
    return list_purchase_orders(
        db,
        status=order_status,
    )


@router.get(
    "/purchase-orders/number/{purchase_order_number}",
    response_model=PurchaseOrderResponse,
    dependencies=[Depends(require_permission("procurement.view"))],
)
def get_purchase_order_by_number_endpoint(
    purchase_order_number: str,
    db: Session = Depends(get_db),
):
    purchase_order = get_purchase_order_by_number(
        db,
        purchase_order_number,
    )

    if purchase_order is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Purchase order not found.",
        )

    return purchase_order


@router.get(
    "/purchase-orders/{purchase_order_id}",
    response_model=PurchaseOrderResponse,
    dependencies=[Depends(require_permission("procurement.view"))],
)
def get_purchase_order(
    purchase_order_id: int,
    db: Session = Depends(get_db),
):
    purchase_order = get_purchase_order_by_id(
        db,
        purchase_order_id,
    )

    if purchase_order is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Purchase order not found.",
        )

    return purchase_order


@router.put(
    "/purchase-orders/{purchase_order_id}",
    response_model=PurchaseOrderResponse,
    dependencies=[Depends(require_permission("procurement.manage"))],
)
def update_purchase_order_endpoint(
    purchase_order_id: int,
    data: PurchaseOrderUpdate,
    db: Session = Depends(get_db),
):
    purchase_order = get_purchase_order_by_id(
        db,
        purchase_order_id,
    )

    if purchase_order is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Purchase order not found.",
        )

    return update_purchase_order(
        db=db,
        purchase_order=purchase_order,
        data=data,
    )


@router.patch(
    "/purchase-orders/{purchase_order_id}/status",
    response_model=PurchaseOrderResponse,
    dependencies=[Depends(require_permission("procurement.manage"))],
)
def update_purchase_order_status_endpoint(
    purchase_order_id: int,
    status_value: str,
    db: Session = Depends(get_db),
):
    purchase_order = get_purchase_order_by_id(
        db,
        purchase_order_id,
    )

    if purchase_order is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Purchase order not found.",
        )

    try:
        return update_purchase_order_status(
            db=db,
            purchase_order=purchase_order,
            status=status_value,
        )

    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(exc),
        ) from exc


@router.delete(
    "/purchase-orders/{purchase_order_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(require_permission("procurement.manage"))],
)
def delete_purchase_order_endpoint(
    purchase_order_id: int,
    db: Session = Depends(get_db),
):
    purchase_order = get_purchase_order_by_id(
        db,
        purchase_order_id,
    )

    if purchase_order is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Purchase order not found.",
        )

    delete_purchase_order(
        db=db,
        purchase_order=purchase_order,
    )

    return None


# ============================================================
# PURCHASE ORDER ITEMS
# ============================================================

@router.put(
    "/purchase-order-items/{item_id}",
    response_model=PurchaseOrderItemResponse,
    dependencies=[Depends(require_permission("procurement.manage"))],
)
def update_purchase_order_item_endpoint(
    item_id: int,
    data: PurchaseOrderItemUpdate,
    db: Session = Depends(get_db),
):
    item = get_purchase_order_item_by_id(
        db,
        item_id,
    )

    if item is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Purchase order item not found.",
        )

    return update_purchase_order_item(
        db=db,
        item=item,
        data=data,
    )


@router.delete(
    "/purchase-order-items/{item_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(require_permission("procurement.manage"))],
)
def delete_purchase_order_item_endpoint(
    item_id: int,
    db: Session = Depends(get_db),
):
    item = get_purchase_order_item_by_id(
        db,
        item_id,
    )

    if item is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Purchase order item not found.",
        )

    delete_purchase_order_item(
        db=db,
        item=item,
    )

    return None
