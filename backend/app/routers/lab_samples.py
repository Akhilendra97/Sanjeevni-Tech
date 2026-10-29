from app.core.dependencies import get_current_user_payload, require_permission
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.lab_sample import LabSample
from app.models.lab_test import LabTest
from app.schemas.lab_sample import LabSampleCreate, LabSampleResponse, LabSampleUpdate
from app.services.lab_sample_service import create_lab_sample, delete_lab_sample, get_lab_sample_by_id, list_lab_samples, update_lab_sample
from app.services.lab_access import lab_id_for_payload, require_sample_lab

router = APIRouter(prefix="/lab-samples", tags=["Laboratory Samples"])

@router.post("", response_model=LabSampleResponse, status_code=status.HTTP_201_CREATED,
             dependencies=[Depends(require_permission("laboratory.manage"))])
def create_sample(data: LabSampleCreate, db: Session = Depends(get_db),
                  payload: dict = Depends(get_current_user_payload)):
    lab_id = lab_id_for_payload(db, payload)
    if lab_id is not None:
        test = db.get(LabTest, data.lab_test_id)
        if not test or test.lab_id != lab_id:
            raise HTTPException(status_code=403, detail="You can only create samples for tests owned by your laboratory.")
    try:
        return create_lab_sample(db, data)
    except ValueError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc

@router.get("", response_model=list[LabSampleResponse],
            dependencies=[Depends(require_permission("laboratory.view"))])
def get_samples(db: Session = Depends(get_db), payload: dict = Depends(get_current_user_payload)):
    lab_id = lab_id_for_payload(db, payload)
    if lab_id is not None:
        return (db.query(LabSample).join(LabTest, LabSample.lab_test_id == LabTest.id)
                .filter(LabTest.lab_id == lab_id).order_by(LabSample.id.desc()).all())
    return list_lab_samples(db)

@router.get("/{sample_id}", response_model=LabSampleResponse,
            dependencies=[Depends(require_permission("laboratory.view"))])
def get_sample(sample_id: int, db: Session = Depends(get_db),
               payload: dict = Depends(get_current_user_payload)):
    lab_id = lab_id_for_payload(db, payload)
    sample = require_sample_lab(db, sample_id, lab_id) if lab_id is not None else get_lab_sample_by_id(db, sample_id)
    if sample is None:
        raise HTTPException(status_code=404, detail="Laboratory sample not found.")
    return sample

@router.patch("/{sample_id}", response_model=LabSampleResponse,
              dependencies=[Depends(require_permission("laboratory.manage"))])
def update_sample(sample_id: int, data: LabSampleUpdate, db: Session = Depends(get_db),
                  payload: dict = Depends(get_current_user_payload)):
    lab_id = lab_id_for_payload(db, payload)
    sample = require_sample_lab(db, sample_id, lab_id) if lab_id is not None else get_lab_sample_by_id(db, sample_id)
    if sample is None:
        raise HTTPException(status_code=404, detail="Laboratory sample not found.")
    updates = data.model_dump(exclude_unset=True)
    if lab_id is not None and "lab_test_id" in updates:
        test = db.get(LabTest, updates["lab_test_id"])
        if not test or test.lab_id != lab_id:
            raise HTTPException(status_code=403, detail="Cannot reassign a sample to another laboratory's test.")
    try:
        return update_lab_sample(db, sample, data)
    except ValueError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc

@router.delete("/{sample_id}", status_code=status.HTTP_204_NO_CONTENT,
               dependencies=[Depends(require_permission("laboratory.manage"))])
def delete_sample(sample_id: int, db: Session = Depends(get_db),
                  payload: dict = Depends(get_current_user_payload)):
    lab_id = lab_id_for_payload(db, payload)
    sample = require_sample_lab(db, sample_id, lab_id) if lab_id is not None else get_lab_sample_by_id(db, sample_id)
    if sample is None:
        raise HTTPException(status_code=404, detail="Laboratory sample not found.")
    delete_lab_sample(db, sample)
