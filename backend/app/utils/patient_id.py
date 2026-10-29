from __future__ import annotations

from datetime import datetime, timezone
import secrets
import re


DEFAULT_PREFIX = "PAT"


def generate_patient_id(
    prefix: str = DEFAULT_PREFIX,
    current_time: datetime | None = None,
) -> str:
    """
    Generate a unique patient identifier.

    Format:
    PAT-YYYYMMDD-RANDOM
    """
    if not prefix or not prefix.strip():
        raise ValueError("Patient ID prefix is required.")

    normalized_prefix = prefix.strip().upper()

    if not normalized_prefix.isalnum():
        raise ValueError(
            "Patient ID prefix must contain only letters and numbers."
        )

    timestamp = current_time or datetime.now(timezone.utc)

    if timestamp.tzinfo is None:
        timestamp = timestamp.replace(tzinfo=timezone.utc)
    else:
        timestamp = timestamp.astimezone(timezone.utc)

    random_part = secrets.token_hex(4).upper()

    return (
        f"{normalized_prefix}-"
        f"{timestamp:%Y%m%d}-"
        f"{random_part}"
    )


def is_valid_patient_id(
    patient_id: str,
    prefix: str = DEFAULT_PREFIX,
) -> bool:
    """Validate the structure of a generated patient identifier."""
    if not patient_id or not patient_id.strip():
        return False

    normalized_prefix = prefix.strip().upper()

    if not normalized_prefix.isalnum():
        return False

    pattern = (
        rf"^{re.escape(normalized_prefix)}-"
        r"\d{8}-"
        r"[0-9A-F]{8}$"
    )

    if not re.fullmatch(
        pattern,
        patient_id.strip().upper(),
    ):
        return False

    date_part = patient_id.strip().split("-")[1]

    try:
        datetime.strptime(date_part, "%Y%m%d")
    except ValueError:
        return False

    return True


def normalize_patient_id(patient_id: str) -> str:
    """Normalize a patient identifier for comparisons."""
    if not patient_id or not patient_id.strip():
        raise ValueError("Patient ID is required.")

    return patient_id.strip().upper()


def build_patient_reference(
    patient_id: str,
    prefix: str = "MRN",
) -> str:
    """
    Build a medical-record reference from a patient identifier.

    Example:
    MRN-PAT-20261003-A1B2C3D4
    """
    normalized_patient_id = normalize_patient_id(patient_id)

    if not prefix or not prefix.strip():
        raise ValueError("Reference prefix is required.")

    normalized_prefix = prefix.strip().upper()

    if not normalized_prefix.isalnum():
        raise ValueError(
            "Reference prefix must contain only letters and numbers."
        )

    return f"{normalized_prefix}-{normalized_patient_id}"


def extract_patient_id_from_reference(
    reference: str,
    prefix: str = "MRN",
) -> str:
    """Extract the patient ID from a generated medical-record reference."""
    if not reference or not reference.strip():
        raise ValueError("Reference is required.")

    normalized_reference = reference.strip().upper()
    normalized_prefix = prefix.strip().upper()

    expected_prefix = f"{normalized_prefix}-"

    if not normalized_reference.startswith(expected_prefix):
        raise ValueError("Invalid patient reference prefix.")

    patient_id = normalized_reference[len(expected_prefix):]

    if not is_valid_patient_id(patient_id):
        raise ValueError("Invalid patient ID in reference.")

    return patient_id
