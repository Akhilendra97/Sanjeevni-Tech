from sqlalchemy.orm import Session

from app.models.nursing import NursingNote


def create_nursing_note(
    db: Session,
    *,
    nurse_id: int,
    patient_id: int,
    note_type: str = "general",
    subject: str | None = None,
    note: str,
) -> NursingNote:

    nursing_note = NursingNote(
        nurse_id=nurse_id,
        patient_id=patient_id,
        note_type=note_type,
        subject=subject,
        note=note,
    )

    db.add(nursing_note)
    db.commit()
    db.refresh(nursing_note)

    return nursing_note


def get_nursing_note_by_id(
    db: Session,
    nursing_note_id: int,
) -> NursingNote | None:

    return (
        db.query(NursingNote)
        .filter(NursingNote.id == nursing_note_id)
        .first()
    )


def list_nursing_notes(
    db: Session,
) -> list[NursingNote]:

    return (
        db.query(NursingNote)
        .order_by(NursingNote.id.desc())
        .all()
    )


def update_nursing_note(
    db: Session,
    nursing_note: NursingNote,
    *,
    note_type: str | None = None,
    subject: str | None = None,
    note: str | None = None,
) -> NursingNote:

    if note_type is not None:
        nursing_note.note_type = note_type

    if subject is not None:
        nursing_note.subject = subject

    if note is not None:
        nursing_note.note = note

    db.commit()
    db.refresh(nursing_note)

    return nursing_note


def delete_nursing_note(
    db: Session,
    nursing_note: NursingNote,
) -> None:

    db.delete(nursing_note)
    db.commit()