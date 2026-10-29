from app.core.dependencies import require_permission
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.supplier import (
    SupplierCreate,
    SupplierResponse,
    SupplierUpdate,
)
from app.services.supplier_service import (
    create_supplier,
    delete_supplier,
    get_supplier_by_id,
    list_active_suppliers,
    list_suppliers,
    update_supplier,
)


router = APIRouter(
    prefix="/suppliers",
    tags=["Suppliers"],
)


@router.post(
    "",
    response_model=SupplierResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_permission("suppliers.manage"))],
)
def create_supplier_endpoint(
    data: SupplierCreate,
    db: Session = Depends(get_db),
):
    try:
        return create_supplier(
            db=db,
            data=data,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(exc),
        ) from exc


@router.get(
    "",
    response_model=list[SupplierResponse],
    status_code=status.HTTP_200_OK,
    dependencies=[Depends(require_permission("suppliers.view"))],
)
def get_all_suppliers(
    db: Session = Depends(get_db),
):
    return list_suppliers(db)


@router.get(
    "/active",
    response_model=list[SupplierResponse],
    status_code=status.HTTP_200_OK,
    dependencies=[Depends(require_permission("suppliers.view"))],
)
def get_active_suppliers(
    db: Session = Depends(get_db),
):
    return list_active_suppliers(db)


@router.get(
    "/{supplier_id}",
    response_model=SupplierResponse,
    status_code=status.HTTP_200_OK,
    dependencies=[Depends(require_permission("suppliers.view"))],
)
def get_supplier(
    supplier_id: int,
    db: Session = Depends(get_db),
):
    supplier = get_supplier_by_id(
        db=db,
        supplier_id=supplier_id,
    )

    if supplier is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Supplier not found.",
        )

    return supplier


@router.put(
    "/{supplier_id}",
    response_model=SupplierResponse,
    status_code=status.HTTP_200_OK,
    dependencies=[Depends(require_permission("suppliers.manage"))],
)
def update_supplier_endpoint(
    supplier_id: int,
    data: SupplierUpdate,
    db: Session = Depends(get_db),
):
    supplier = get_supplier_by_id(
        db=db,
        supplier_id=supplier_id,
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
            data=data,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(exc),
        ) from exc


@router.delete(
    "/{supplier_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(require_permission("suppliers.manage"))],
)
def delete_supplier_endpoint(
    supplier_id: int,
    db: Session = Depends(get_db),
):
    supplier = get_supplier_by_id(
        db=db,
        supplier_id=supplier_id,
    )

    if supplier is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Supplier not found.",
        )

    delete_supplier(
        db=db,
        supplier=supplier,
    )

    return None
