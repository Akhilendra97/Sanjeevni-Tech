from datetime import date

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.document import Document
from app.models.patient import Patient
from app.models.user import User
from app.schemas.document import DocumentCreate, DocumentUpdate


def create_document(
    db: Session,
    document_data: DocumentCreate,
) -> Document:
    patient = db.scalar(
        select(Patient).where(
            Patient.id == document_data.patient_id
        )
    )

    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient not found",
        )

    if document_data.uploaded_by is not None:
        user = db.scalar(
            select(User).where(
                User.id == document_data.uploaded_by
            )
        )

        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Uploading user not found",
            )

    document = Document(
        patient_id=document_data.patient_id,
        uploaded_by=document_data.uploaded_by,
        document_type=document_data.document_type,
        document_title=document_data.document_title,
        file_name=document_data.file_name,
        file_path=document_data.file_path,
        mime_type=document_data.mime_type,
        file_size=document_data.file_size,
        document_date=document_data.document_date,
        description=document_data.description,
        is_active=document_data.is_active,
    )

    db.add(document)
    db.commit()
    db.refresh(document)

    return document


def get_document(
    db: Session,
    document_id: int,
) -> Document:
    document = db.scalar(
        select(Document).where(
            Document.id == document_id
        )
    )

    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found",
        )

    return document


def list_documents(
    db: Session,
    patient_id: int | None = None,
    document_type: str | None = None,
    is_active: bool | None = None,
    document_date: date | None = None,
) -> list[Document]:
    query = select(Document)

    if patient_id is not None:
        query = query.where(
            Document.patient_id == patient_id
        )

    if document_type is not None:
        query = query.where(
            Document.document_type == document_type
        )

    if is_active is not None:
        query = query.where(
            Document.is_active == is_active
        )

    if document_date is not None:
        query = query.where(
            Document.document_date == document_date
        )

    query = query.order_by(
        Document.created_at.desc(),
        Document.id.desc(),
    )

    return list(
        db.scalars(query).all()
    )


def update_document(
    db: Session,
    document_id: int,
    document_data: DocumentUpdate,
) -> Document:
    document = get_document(
        db,
        document_id,
    )

    update_data = document_data.model_dump(
        exclude_unset=True
    )

    if "patient_id" in update_data:
        patient = db.scalar(
            select(Patient).where(
                Patient.id == update_data["patient_id"]
            )
        )

        if not patient:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Patient not found",
            )

    if "uploaded_by" in update_data:
        uploaded_by = update_data["uploaded_by"]

        if uploaded_by is not None:
            user = db.scalar(
                select(User).where(
                    User.id == uploaded_by
                )
            )

            if not user:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Uploading user not found",
                )

    for field, value in update_data.items():
        setattr(document, field, value)

    db.commit()
    db.refresh(document)

    return document


def delete_document(
    db: Session,
    document_id: int,
) -> None:
    document = get_document(
        db,
        document_id,
    )

    db.delete(document)
    db.commit()
