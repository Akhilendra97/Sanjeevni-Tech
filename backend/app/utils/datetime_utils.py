from __future__ import annotations

from datetime import date, datetime, time, timedelta, timezone
from typing import Any


def utc_now() -> datetime:
    """Return the current timezone-aware UTC datetime."""
    return datetime.now(timezone.utc)


def today_utc() -> date:
    """Return today's UTC date."""
    return utc_now().date()


def ensure_utc(value: datetime) -> datetime:
    """
    Convert a datetime to timezone-aware UTC.

    Naive datetimes are treated as UTC.
    """
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)

    return value.astimezone(timezone.utc)


def start_of_day(value: date | datetime) -> datetime:
    """Return the UTC start of the supplied day."""
    if isinstance(value, datetime):
        value = ensure_utc(value).date()

    return datetime.combine(
        value,
        time.min,
        tzinfo=timezone.utc,
    )


def end_of_day(value: date | datetime) -> datetime:
    """Return the UTC end of the supplied day."""
    if isinstance(value, datetime):
        value = ensure_utc(value).date()

    return datetime.combine(
        value,
        time.max,
        tzinfo=timezone.utc,
    )


def parse_datetime(value: Any) -> datetime | None:
    """
    Parse common datetime representations.

    Supported:
    - datetime
    - ISO datetime string
    - ISO date string
    """
    if value is None:
        return None

    if isinstance(value, datetime):
        return ensure_utc(value)

    if isinstance(value, date):
        return start_of_day(value)

    if isinstance(value, str):
        text = value.strip()

        if not text:
            return None

        try:
            parsed = datetime.fromisoformat(
                text.replace("Z", "+00:00")
            )
            return ensure_utc(parsed)
        except ValueError:
            try:
                parsed_date = date.fromisoformat(text)
                return start_of_day(parsed_date)
            except ValueError as exc:
                raise ValueError(
                    f"Invalid datetime value: {value}"
                ) from exc

    raise TypeError(
        f"Unsupported datetime value type: {type(value).__name__}"
    )


def parse_date(value: Any) -> date | None:
    """Parse a date from a date, datetime, or ISO date string."""
    if value is None:
        return None

    if isinstance(value, datetime):
        return ensure_utc(value).date()

    if isinstance(value, date):
        return value

    if isinstance(value, str):
        text = value.strip()

        if not text:
            return None

        try:
            return date.fromisoformat(text)
        except ValueError:
            try:
                return parse_datetime(text).date()
            except (ValueError, AttributeError) as exc:
                raise ValueError(
                    f"Invalid date value: {value}"
                ) from exc

    raise TypeError(
        f"Unsupported date value type: {type(value).__name__}"
    )


def is_within_range(
    value: datetime,
    start: datetime,
    end: datetime,
) -> bool:
    """Return True when value falls within the inclusive datetime range."""
    value_utc = ensure_utc(value)
    start_utc = ensure_utc(start)
    end_utc = ensure_utc(end)

    if end_utc < start_utc:
        raise ValueError("End datetime cannot be before start datetime.")

    return start_utc <= value_utc <= end_utc


def validate_date_range(
    start: date | datetime,
    end: date | datetime,
) -> bool:
    """Validate that an end date/datetime is not before the start."""
    if isinstance(start, datetime) and isinstance(end, datetime):
        start_value = ensure_utc(start)
        end_value = ensure_utc(end)
    else:
        start_value = parse_date(start)
        end_value = parse_date(end)

    if start_value is None or end_value is None:
        raise ValueError("Both start and end values are required.")

    if end_value < start_value:
        raise ValueError(
            "End date/datetime cannot be before start date/datetime."
        )

    return True


def add_days(
    value: date | datetime,
    days: int,
) -> date | datetime:
    """Add a number of days while preserving the input type."""
    return value + timedelta(days=days)


def age_on_date(
    date_of_birth: date,
    reference_date: date | None = None,
) -> int:
    """Calculate age in completed years."""
    if reference_date is None:
        reference_date = today_utc()

    if date_of_birth > reference_date:
        raise ValueError(
            "Date of birth cannot be in the future."
        )

    age = reference_date.year - date_of_birth.year

    birthday_not_reached = (
        (reference_date.month, reference_date.day)
        < (date_of_birth.month, date_of_birth.day)
    )

    if birthday_not_reached:
        age -= 1

    return age


def combine_date_time(
    value_date: date,
    value_time: time,
) -> datetime:
    """Combine a date and time into a UTC-aware datetime."""
    return datetime.combine(
        value_date,
        value_time,
        tzinfo=timezone.utc,
    )


def to_iso(value: date | datetime | None) -> str | None:
    """Convert a date/datetime to an ISO-8601 string."""
    if value is None:
        return None

    if isinstance(value, datetime):
        return ensure_utc(value).isoformat()

    return value.isoformat()
