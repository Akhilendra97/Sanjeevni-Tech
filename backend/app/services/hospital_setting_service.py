from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.hospital_setting import HospitalSetting
from app.schemas.hospital_setting import HospitalSettingUpdate


def get_hospital_settings(
    db: Session,
) -> HospitalSetting:

    setting = db.scalar(
        select(HospitalSetting)
        .order_by(HospitalSetting.id.asc())
        .limit(1)
    )

    if setting is not None:
        return setting

    setting = HospitalSetting()

    db.add(setting)
    db.commit()
    db.refresh(setting)

    return setting


def update_hospital_settings(
    db: Session,
    data: HospitalSettingUpdate,
) -> HospitalSetting:

    setting = get_hospital_settings(db)

    values = data.model_dump(
        exclude_unset=False,
    )

    for field, value in values.items():
        setattr(setting, field, value)

    db.add(setting)
    db.commit()
    db.refresh(setting)

    return setting
