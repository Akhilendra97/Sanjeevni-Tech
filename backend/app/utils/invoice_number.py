from __future__ import annotations

from datetime import datetime, timezone
import secrets


def generate_invoice_number(
    prefix: str = "INV",
    current_time: datetime | None = None,
) -> str:
    """
    Generate a unique invoice number.

    Format:
    PREFIX-YYYYMMDD-HHMMSS-RANDOM
    """
    if not prefix or not prefix.strip():
        raise ValueError("Invoice prefix is required.")

    normalized_prefix = prefix.strip().upper()

    if not normalized_prefix.isalnum():
        raise ValueError(
            "Invoice prefix must contain only letters and numbers."
        )

    timestamp = current_time or datetime.now(timezone.utc)

    if timestamp.tzinfo is None:
        timestamp = timestamp.replace(tzinfo=timezone.utc)
    else:
        timestamp = timestamp.astimezone(timezone.utc)

    random_part = secrets.token_hex(3).upper()

    return (
        f"{normalized_prefix}-"
        f"{timestamp:%Y%m%d}-"
        f"{timestamp:%H%M%S}-"
        f"{random_part}"
    )


def generate_payment_number(
    prefix: str = "PAY",
    current_time: datetime | None = None,
) -> str:
    """Generate a unique payment reference number."""
    return generate_invoice_number(
        prefix=prefix,
        current_time=current_time,
    )


def generate_prescription_number(
    prefix: str = "RX",
    current_time: datetime | None = None,
) -> str:
    """Generate a unique prescription reference number."""
    return generate_invoice_number(
        prefix=prefix,
        current_time=current_time,
    )


def generate_admission_number(
    prefix: str = "ADM",
    current_time: datetime | None = None,
) -> str:
    """Generate a unique admission reference number."""
    return generate_invoice_number(
        prefix=prefix,
        current_time=current_time,
    )


def generate_discharge_number(
    prefix: str = "DIS",
    current_time: datetime | None = None,
) -> str:
    """Generate a unique discharge reference number."""
    return generate_invoice_number(
        prefix=prefix,
        current_time=current_time,
    )


def is_valid_reference_number(
    reference_number: str,
    prefix: str | None = None,
) -> bool:
    """Validate the general structure of a generated reference number."""
    if not reference_number or not reference_number.strip():
        return False

    parts = reference_number.strip().split("-")

    if len(parts) != 4:
        return False

    reference_prefix, date_part, time_part, random_part = parts

    if prefix is not None:
        if reference_prefix != prefix.strip().upper():
            return False

    if not (
        len(date_part) == 8
        and date_part.isdigit()
        and len(time_part) == 6
        and time_part.isdigit()
        and len(random_part) == 6
        and all(
            character in "0123456789ABCDEF"
            for character in random_part
        )
    ):
        return False

    try:
        datetime.strptime(
            f"{date_part}{time_part}",
            "%Y%m%d%H%M%S",
        )
    except ValueError:
        return False

    return True
