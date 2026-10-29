from app.core.dependencies import require_permission
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.lab_test import (
    LabTestCreate,
    LabTestResponse,
    LabTestUpdate,
)
from app.services.lab_test_service import (
    create_lab_test,
    delete_lab_test,
    get_lab_test_by_id,
    list_lab_tests,
    update_lab_test,
)

router = APIRouter(
    prefix="/lab-tests",
    tags=["Laboratory Tests"],
)


@router.post(
    "",
    response_model=LabTestResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_permission("laboratory.manage"))],
)
def create_test(
    data: LabTestCreate,
    db: Session = Depends(get_db),
):
    try:
        return create_lab_test(db, data)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(exc),
        ) from exc


@router.get(
    "",
    response_model=list[LabTestResponse],
    dependencies=[Depends(require_permission("laboratory.view"))],
)
def get_tests(
    db: Session = Depends(get_db),
):
    return list_lab_tests(db)


@router.get(
    "/{test_id}",
    response_model=LabTestResponse,
    dependencies=[Depends(require_permission("laboratory.view"))],
)
def get_test(
    test_id: int,
    db: Session = Depends(get_db),
):
    test = get_lab_test_by_id(db, test_id)

    if test is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Laboratory test not found.",
        )

    return test


@router.patch(
    "/{test_id}",
    response_model=LabTestResponse,
    dependencies=[Depends(require_permission("laboratory.manage"))],
)
def update_test(
    test_id: int,
    data: LabTestUpdate,
    db: Session = Depends(get_db),
):
    test = get_lab_test_by_id(db, test_id)

    if test is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Laboratory test not found.",
        )

    try:
        return update_lab_test(db, test, data)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(exc),
        ) from exc


@router.delete(
    "/{test_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(require_permission("laboratory.manage"))],
)
def delete_test(
    test_id: int,
    db: Session = Depends(get_db),
):
    test = get_lab_test_by_id(db, test_id)

    if test is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Laboratory test not found.",
        )

    delete_lab_test(db, test)