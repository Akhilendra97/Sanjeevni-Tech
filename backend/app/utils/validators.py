from __future__ import annotations

from datetime import date, datetime
import re
from typing import Any


EMAIL_PATTERN = re.compile(
    r"^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$"
)

PHONE_PATTERN = re.compile(
    r"^\+?[0-9]{10,15}$"
)

ALPHANUMERIC_PATTERN = re.compile(
    r"^[A-Za-z0-9]+$"
)


def validate_required(
    value: Any,
    field_name: str = "Field",
) -> str:
    """Validate and return a required non-empty string."""
    if value is None:
        raise ValueError(f"{field_name} is required.")

    text = str(value).strip()

    if not text:
        raise ValueError(f"{field_name} is required.")

    return text


def validate_email(email: str) -> str:
    """Validate and normalize an email address."""
    value = validate_required(email, "Email").lower()

    if not EMAIL_PATTERN.fullmatch(value):
        raise ValueError("Invalid email address.")

    return value


def validate_phone(phone: str) -> str:
    """Validate a phone number."""
    value = validate_required(phone, "Phone number")

    normalized = re.sub(r"[\s()-]", "", value)

    if not PHONE_PATTERN.fullmatch(normalized):
        raise ValueError("Invalid phone number.")

    return normalized


def validate_alphanumeric(
    value: str,
    field_name: str = "Value",
) -> str:
    """Validate that a value contains only letters and numbers."""
    normalized = validate_required(value, field_name)

    if not ALPHANUMERIC_PATTERN.fullmatch(normalized):
        raise ValueError(
            f"{field_name} must contain only letters and numbers."
        )

    return normalized


def validate_positive_number(
    value: Any,
    field_name: str = "Value",
) -> float:
    """Validate a number greater than zero."""
    try:
        number = float(value)
    except (TypeError, ValueError) as exc:
        raise ValueError(
            f"{field_name} must be a valid number."
        ) from exc

    if number <= 0:
        raise ValueError(
            f"{field_name} must be greater than zero."
        )

    return number


def validate_non_negative_number(
    value: Any,
    field_name: str = "Value",
) -> float:
    """Validate a number greater than or equal to zero."""
    try:
        number = float(value)
    except (TypeError, ValueError) as exc:
        raise ValueError(
            f"{field_name} must be a valid number."
        ) from exc

    if number < 0:
        raise ValueError(
            f"{field_name} cannot be negative."
        )

    return number


def validate_integer(
    value: Any,
    field_name: str = "Value",
) -> int:
    """Validate and convert an integer value."""
    if isinstance(value, bool):
        raise ValueError(
            f"{field_name} must be an integer."
        )

    try:
        number = int(value)
    except (TypeError, ValueError) as exc:
        raise ValueError(
            f"{field_name} must be an integer."
        ) from exc

    return number


def validate_positive_integer(
    value: Any,
    field_name: str = "Value",
) -> int:
    """Validate an integer greater than zero."""
    number = validate_integer(value, field_name)

    if number <= 0:
        raise ValueError(
            f"{field_name} must be greater than zero."
        )

    return number


def validate_range(
    value: Any,
    minimum: float,
    maximum: float,
    field_name: str = "Value",
) -> float:
    """Validate that a numeric value falls within an inclusive range."""
    if maximum < minimum:
        raise ValueError(
            "Maximum cannot be less than minimum."
        )

    try:
        number = float(value)
    except (TypeError, ValueError) as exc:
        raise ValueError(
            f"{field_name} must be a valid number."
        ) from exc

    if not minimum <= number <= maximum:
        raise ValueError(
            f"{field_name} must be between "
            f"{minimum} and {maximum}."
        )

    return number


def validate_date_not_future(
    value: date,
    field_name: str = "Date",
) -> date:
    """Validate that a date is not in the future."""
    if not isinstance(value, date):
        raise ValueError(
            f"{field_name} must be a valid date."
        )

    today = date.today()

    if value > today:
        raise ValueError(
            f"{field_name} cannot be in the future."
        )

    return value


def validate_datetime_not_future(
    value: datetime,
    field_name: str = "Datetime",
) -> datetime:
    """Validate that a datetime is not in the future."""
    if not isinstance(value, datetime):
        raise ValueError(
            f"{field_name} must be a valid datetime."
        )

    from datetime import timezone

    if value.tzinfo is None:
        comparison_value = value
        current_value = datetime.now()
    else:
        comparison_value = value.astimezone(timezone.utc)
        current_value = datetime.now(timezone.utc)

    if comparison_value > current_value:
        raise ValueError(
            f"{field_name} cannot be in the future."
        )

    return value


def validate_date_order(
    start_date: date,
    end_date: date,
    start_field: str = "Start date",
    end_field: str = "End date",
) -> bool:
    """Validate that an end date is not before a start date."""
    if not isinstance(start_date, date):
        raise ValueError(
            f"{start_field} must be a valid date."
        )

    if not isinstance(end_date, date):
        raise ValueError(
            f"{end_field} must be a valid date."
        )

    if end_date < start_date:
        raise ValueError(
            f"{end_field} cannot be before {start_field}."
        )

    return True


def validate_string_length(
    value: str,
    minimum: int | None = None,
    maximum: int | None = None,
    field_name: str = "Value",
) -> str:
    """Validate string length."""
    text = validate_required(value, field_name)

    if minimum is not None and len(text) < minimum:
        raise ValueError(
            f"{field_name} must contain at least {minimum} characters."
        )

    if maximum is not None and len(text) > maximum:
        raise ValueError(
            f"{field_name} must contain at most {maximum} characters."
        )

    return text


def validate_choice(
    value: str,
    choices: set[str] | list[str] | tuple[str, ...],
    field_name: str = "Value",
) -> str:
    """Validate that a value belongs to a predefined set."""
    normalized_value = validate_required(value, field_name)

    normalized_choices = {
        str(choice).strip().lower()
        for choice in choices
    }

    if normalized_value.lower() not in normalized_choices:
        raise ValueError(
            f"{field_name} must be one of: "
            f"{', '.join(sorted(normalized_choices))}."
        )

    return normalized_value


def validate_id(
    value: Any,
    field_name: str = "ID",
) -> int:
    """Validate a positive database-style integer ID."""
    identifier = validate_positive_integer(value, field_name)
    return identifier
