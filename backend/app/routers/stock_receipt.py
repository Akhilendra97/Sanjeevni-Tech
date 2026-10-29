from app.core.dependencies import require_permission
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.stock_receipt import (
    StockReceiptCreate,
    StockReceiptResponse,
)
from app.services.stock_receipt_service import (
    create_stock_receipt,
    delete_stock_receipt,
    get_stock_receipt_by_id,
    get_stock_receipt_by_number,
    list_stock_receipts,
)


router = APIRouter(
    prefix="/stock-receipts",
    tags=["Pharmacy - Stock Receiving"],
)


def _service_error(error: ValueError) -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail=str(error),
    )


@router.post(
    "",
    response_model=StockReceiptResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_permission("inventory.manage"))],
)
def create_receipt(
    data: StockReceiptCreate,
    db: Session = Depends(get_db),
):
    try:
        receipt = create_stock_receipt(
            db,
            data,
        )

        db.commit()

        db.refresh(receipt)

        return receipt

    except ValueError as exc:
        db.rollback()
        raise _service_error(exc)


@router.get(
    "",
    response_model=list[StockReceiptResponse],
    dependencies=[Depends(require_permission("inventory.view"))],
)
def get_receipts(
    purchase_order_id: int | None = Query(
        default=None,
        gt=0,
    ),
    db: Session = Depends(get_db),
):
    return list_stock_receipts(
        db,
        purchase_order_id=purchase_order_id,
    )


@router.get(
    "/number/{receipt_number}",
    response_model=StockReceiptResponse,
    dependencies=[Depends(require_permission("inventory.view"))],
)
def get_receipt_by_number(
    receipt_number: str,
    db: Session = Depends(get_db),
):
    receipt = get_stock_receipt_by_number(
        db,
        receipt_number,
    )

    if receipt is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Stock receipt not found.",
        )

    return receipt


@router.get(
    "/purchase-order/{purchase_order_id}",
    response_model=list[StockReceiptResponse],
    dependencies=[Depends(require_permission("inventory.view"))],
)
def get_receipts_for_purchase_order(
    purchase_order_id: int,
    db: Session = Depends(get_db),
):
    return list_stock_receipts(
        db,
        purchase_order_id=purchase_order_id,
    )


@router.get(
    "/{receipt_id}",
    response_model=StockReceiptResponse,
    dependencies=[Depends(require_permission("inventory.view"))],
)
def get_receipt(
    receipt_id: int,
    db: Session = Depends(get_db),
):
    receipt = get_stock_receipt_by_id(
        db,
        receipt_id,
    )

    if receipt is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Stock receipt not found.",
        )

    return receipt


@router.delete(
    "/{receipt_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(require_permission("inventory.manage"))],
)
def remove_receipt(
    receipt_id: int,
    db: Session = Depends(get_db),
):
    try:
        delete_stock_receipt(
            db,
            receipt_id,
        )

        db.commit()

    except ValueError as exc:
        db.rollback()
        raise _service_error(exc)

    return None
