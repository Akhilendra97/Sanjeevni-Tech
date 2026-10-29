from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.constants import UserRole
from app.core.database import get_db
from app.core.dependencies import require_role
from app.models.hospital_setting import HospitalSetting
from app.schemas.hospital_setting import (
    HospitalSettingResponse,
    HospitalSettingUpdate,
)
from app.services.hospital_setting_service import (
    get_hospital_settings,
    update_hospital_settings,
)


router = APIRouter(
    prefix="/hospital-settings",
    tags=["Hospital Settings"],
)


@router.get(
    "",
    response_model=HospitalSettingResponse,
)
def get_settings(
    db: Session = Depends(get_db),
    _: dict = Depends(
        require_role(UserRole.ADMIN)
    ),
) -> HospitalSetting:

    return get_hospital_settings(db)


@router.put(
    "",
    response_model=HospitalSettingResponse,
)
def update_settings(
    data: HospitalSettingUpdate,
    db: Session = Depends(get_db),
    _: dict = Depends(
        require_role(UserRole.ADMIN)
    ),
) -> HospitalSetting:

    return update_hospital_settings(
        db,
        data,
    )
