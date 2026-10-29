from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.blood_bank import (
    BloodBankCreate,
    BloodBankResponse,
    BloodBankUpdate,
)
from app.schemas.blood_request import (
    BloodRequestCreate,
    BloodRequestResponse,
    BloodRequestUpdate,
)
from app.schemas.blood_unit import (
    BloodUnitCreate,
    BloodUnitResponse,
    BloodUnitUpdate,
)
from app.services.blood_bank_service import (
    create_blood_bank,
    delete_blood_bank,
    get_blood_bank_by_id,
    list_blood_banks,
    update_blood_bank,
    create_blood_request,
    delete_blood_request,
    get_blood_request_by_id,
    list_blood_requests,
    update_blood_request,
    create_blood_unit,
    delete_blood_unit,
    get_blood_unit_by_id,
    list_blood_units,
    update_blood_unit,
)


router = APIRouter(
    prefix="/blood-bank",
    tags=["Blood Bank"],
)


# =========================================================
# BLOOD BANK
# =========================================================

@router.post(
    "",
    response_model=BloodBankResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_bank(
    data: BloodBankCreate,
    db: Session = Depends(get_db),
):
    try:
        return create_blood_bank(db, data)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(exc),
        ) from exc


@router.get(
    "",
    response_model=list[BloodBankResponse],
)
def get_banks(
    db: Session = Depends(get_db),
):
    return list_blood_banks(db)


@router.get(
    "/{blood_bank_id}",
    response_model=BloodBankResponse,
)
def get_bank(
    blood_bank_id: int,
    db: Session = Depends(get_db),
):
    blood_bank = get_blood_bank_by_id(
        db,
        blood_bank_id,
    )

    if blood_bank is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Blood bank not found.",
        )

    return blood_bank


@router.patch(
    "/{blood_bank_id}",
    response_model=BloodBankResponse,
)
def update_bank(
    blood_bank_id: int,
    data: BloodBankUpdate,
    db: Session = Depends(get_db),
):
    blood_bank = get_blood_bank_by_id(
        db,
        blood_bank_id,
    )

    if blood_bank is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Blood bank not found.",
        )

    try:
        return update_blood_bank(
            db,
            blood_bank,
            data,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(exc),
        ) from exc


@router.delete(
    "/{blood_bank_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_bank(
    blood_bank_id: int,
    db: Session = Depends(get_db),
):
    blood_bank = get_blood_bank_by_id(
        db,
        blood_bank_id,
    )

    if blood_bank is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Blood bank not found.",
        )

    delete_blood_bank(db, blood_bank)


# =========================================================
# BLOOD REQUESTS
# =========================================================

@router.post(
    "/requests",
    response_model=BloodRequestResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_request(
    data: BloodRequestCreate,
    db: Session = Depends(get_db),
):
    return create_blood_request(db, data)


@router.get(
    "/requests",
    response_model=list[BloodRequestResponse],
)
def get_requests(
    db: Session = Depends(get_db),
):
    return list_blood_requests(db)


@router.get(
    "/requests/{request_id}",
    response_model=BloodRequestResponse,
)
def get_request(
    request_id: int,
    db: Session = Depends(get_db),
):
    request = get_blood_request_by_id(
        db,
        request_id,
    )

    if request is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Blood request not found.",
        )

    return request


@router.patch(
    "/requests/{request_id}",
    response_model=BloodRequestResponse,
)
def update_request(
    request_id: int,
    data: BloodRequestUpdate,
    db: Session = Depends(get_db),
):
    request = get_blood_request_by_id(
        db,
        request_id,
    )

    if request is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Blood request not found.",
        )

    return update_blood_request(
        db,
        request,
        data,
    )


@router.delete(
    "/requests/{request_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_request(
    request_id: int,
    db: Session = Depends(get_db),
):
    request = get_blood_request_by_id(
        db,
        request_id,
    )

    if request is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Blood request not found.",
        )

    delete_blood_request(db, request)


# =========================================================
# BLOOD UNITS
# =========================================================

@router.post(
    "/units",
    response_model=BloodUnitResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_unit(
    data: BloodUnitCreate,
    db: Session = Depends(get_db),
):
    return create_blood_unit(db, data)


@router.get(
    "/units",
    response_model=list[BloodUnitResponse],
)
def get_units(
    db: Session = Depends(get_db),
):
    return list_blood_units(db)


@router.get(
    "/units/{unit_id}",
    response_model=BloodUnitResponse,
)
def get_unit(
    unit_id: int,
    db: Session = Depends(get_db),
):
    unit = get_blood_unit_by_id(
        db,
        unit_id,
    )

    if unit is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Blood unit not found.",
        )

    return unit


@router.patch(
    "/units/{unit_id}",
    response_model=BloodUnitResponse,
)
def update_unit(
    unit_id: int,
    data: BloodUnitUpdate,
    db: Session = Depends(get_db),
):
    unit = get_blood_unit_by_id(
        db,
        unit_id,
    )

    if unit is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Blood unit not found.",
        )

    return update_blood_unit(
        db,
        unit,
        data,
    )


@router.delete(
    "/units/{unit_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_unit(
    unit_id: int,
    db: Session = Depends(get_db),
):
    unit = get_blood_unit_by_id(
        db,
        unit_id,
    )

    if unit is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Blood unit not found.",
        )

    delete_blood_unit(db, unit)