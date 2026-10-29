from datetime import date

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.document import (
    DocumentCreate,
    DocumentResponse,
    DocumentUpdate,
)
from app.services.document_service import (
    create_document,
    delete_document,
    get_document,
    list_documents,
    update_document,
)

router = APIRouter(
    prefix="/documents",
    tags=["Document Management"],
)


@router.post(
    "",
    response_model=DocumentResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_document_record(
    document_data: DocumentCreate,
    db: Session = Depends(get_db),
):
    return create_document(
        db=db,
        document_data=document_data,
    )


@router.get(
    "",
    response_model=list[DocumentResponse],
)
def get_document_records(
    patient_id: int | None = Query(
        default=None,
        gt=0,
    ),
    document_type: str | None = None,
    is_active: bool | None = None,
    document_date: date | None = None,
    db: Session = Depends(get_db),
):
    return list_documents(
        db=db,
        patient_id=patient_id,
        document_type=document_type,
        is_active=is_active,
        document_date=document_date,
    )


@router.get(
    "/{document_id}",
    response_model=DocumentResponse,
)
def get_document_record(
    document_id: int,
    db: Session = Depends(get_db),
):
    return get_document(
        db=db,
        document_id=document_id,
    )


@router.put(
    "/{document_id}",
    response_model=DocumentResponse,
)
def update_document_record(
    document_id: int,
    document_data: DocumentUpdate,
    db: Session = Depends(get_db),
):
    return update_document(
        db=db,
        document_id=document_id,
        document_data=document_data,
    )


@router.delete(
    "/{document_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_document_record(
    document_id: int,
    db: Session = Depends(get_db),
):
    delete_document(
        db=db,
        document_id=document_id,
    )
    return None
