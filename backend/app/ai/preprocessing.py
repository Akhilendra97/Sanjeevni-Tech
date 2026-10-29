from __future__ import annotations

from collections.abc import Iterable
from typing import Any

import numpy as np


def to_numeric(
    value: Any,
    default: float = 0.0,
) -> float:
    """Safely convert a value to a numeric float."""
    if value is None:
        return default

    try:
        result = float(value)

        if not np.isfinite(result):
            return default

        return result

    except (TypeError, ValueError):
        return default


def clamp(
    value: float,
    minimum: float,
    maximum: float,
) -> float:
    """Clamp a numeric value to a defined range."""
    return max(
        minimum,
        min(value, maximum),
    )


def normalize(
    value: Any,
    minimum: float,
    maximum: float,
) -> float:
    """Normalize a value to the 0-1 range."""
    numeric_value = to_numeric(value)

    if maximum <= minimum:
        raise ValueError(
            "Maximum must be greater than minimum."
        )

    numeric_value = clamp(
        numeric_value,
        minimum,
        maximum,
    )

    return (numeric_value - minimum) / (
        maximum - minimum
    )


def clean_numeric_features(
    values: Iterable[Any],
    default: float = 0.0,
) -> list[float]:
    """Convert an iterable of values into clean numeric features."""
    return [
        to_numeric(
            value,
            default=default,
        )
        for value in values
    ]


def build_feature_array(
    values: Iterable[Any],
) -> np.ndarray:
    """Create a 2D NumPy feature array suitable for ML inference."""
    features = clean_numeric_features(values)

    return np.asarray(
        [features],
        dtype=float,
    )


def calculate_percentage(
    value: Any,
    maximum: Any,
) -> float:
    """Calculate a safe percentage."""
    numeric_value = to_numeric(value)
    numeric_maximum = to_numeric(maximum)

    if numeric_maximum <= 0:
        return 0.0

    return clamp(
        (numeric_value / numeric_maximum) * 100.0,
        0.0,
        100.0,
    )
