from unittest.mock import Mock

from app.schemas.patient import PatientUpdate
from app.services.patient_service import update_patient


def test_patient_update_can_clear_optional_fields():
    patient = Mock()
    patient.email = "patient@example.com"
    db = Mock()

    # exclude_unset preserves an explicitly supplied null while omitting fields
    # the client did not send. The service must apply that null to clear email.
    data = PatientUpdate(email=None).model_dump(exclude_unset=True)
    assert data == {"email": None}

    updated = update_patient(db, patient, data)

    assert updated is patient
    assert patient.email is None
    db.commit.assert_called_once_with()
    db.refresh.assert_called_once_with(patient)


def test_patient_update_does_not_change_omitted_fields():
    patient = Mock()
    patient.email = "keep@example.com"
    patient.phone = "5551234567"
    db = Mock()

    data = PatientUpdate(phone="5559876543").model_dump(exclude_unset=True)
    update_patient(db, patient, data)

    assert patient.phone == "5559876543"
    assert patient.email == "keep@example.com"
    db.commit.assert_called_once_with()
