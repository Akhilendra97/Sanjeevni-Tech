from __future__ import annotations

from typing import Any

from app.ai.preprocessing import to_numeric


def analyze_heart_rate(
    heart_rate: Any,
) -> dict[str, Any]:
    value = to_numeric(heart_rate)

    if value <= 0:
        return {
            "value": value,
            "status": "unknown",
            "message": "Heart rate not available.",
        }

    if value < 50:
        return {
            "value": value,
            "status": "low",
            "message": "Heart rate is below the configured reference range.",
        }

    if value > 100:
        return {
            "value": value,
            "status": "high",
            "message": "Heart rate is above the configured reference range.",
        }

    return {
        "value": value,
        "status": "normal",
        "message": "Heart rate is within the configured reference range.",
    }


def analyze_respiratory_rate(
    respiratory_rate: Any,
) -> dict[str, Any]:
    value = to_numeric(respiratory_rate)

    if value <= 0:
        return {
            "value": value,
            "status": "unknown",
            "message": "Respiratory rate not available.",
        }

    if value < 12:
        return {
            "value": value,
            "status": "low",
            "message": "Respiratory rate is below the configured reference range.",
        }

    if value > 20:
        return {
            "value": value,
            "status": "high",
            "message": "Respiratory rate is above the configured reference range.",
        }

    return {
        "value": value,
        "status": "normal",
        "message": "Respiratory rate is within the configured reference range.",
    }


def analyze_oxygen_saturation(
    oxygen_saturation: Any,
) -> dict[str, Any]:
    value = to_numeric(
        oxygen_saturation,
        default=0,
    )

    if value <= 0:
        return {
            "value": value,
            "status": "unknown",
            "message": "Oxygen saturation not available.",
        }

    if value < 90:
        return {
            "value": value,
            "status": "critical",
            "message": "Oxygen saturation is critically low.",
        }

    if value < 94:
        return {
            "value": value,
            "status": "low",
            "message": "Oxygen saturation is below the configured reference range.",
        }

    return {
        "value": value,
        "status": "normal",
        "message": "Oxygen saturation is within the configured reference range.",
    }


def analyze_blood_pressure(
    systolic_bp: Any,
    diastolic_bp: Any,
) -> dict[str, Any]:
    systolic = to_numeric(
        systolic_bp,
        default=0,
    )

    diastolic = to_numeric(
        diastolic_bp,
        default=0,
    )

    if systolic <= 0 or diastolic <= 0:
        return {
            "systolic": systolic,
            "diastolic": diastolic,
            "status": "unknown",
            "message": "Blood pressure not available.",
        }

    if systolic < 90 or diastolic < 60:
        status = "low"
        message = (
            "Blood pressure is below the configured "
            "reference range."
        )
    elif systolic >= 140 or diastolic >= 90:
        status = "high"
        message = (
            "Blood pressure is above the configured "
            "reference range."
        )
    else:
        status = "normal"
        message = (
            "Blood pressure is within the configured "
            "reference range."
        )

    return {
        "systolic": systolic,
        "diastolic": diastolic,
        "status": status,
        "message": message,
    }


def analyze_temperature(
    temperature: Any,
) -> dict[str, Any]:
    value = to_numeric(
        temperature,
        default=0,
    )

    if value <= 0:
        return {
            "value": value,
            "status": "unknown",
            "message": "Temperature not available.",
        }

    if value < 35.0:
        return {
            "value": value,
            "status": "low",
            "message": "Temperature is below the configured reference range.",
        }

    if value >= 39.0:
        return {
            "value": value,
            "status": "high",
            "message": "Temperature is significantly elevated.",
        }

    if value >= 38.0:
        return {
            "value": value,
            "status": "elevated",
            "message": "Temperature is elevated.",
        }

    return {
        "value": value,
        "status": "normal",
        "message": "Temperature is within the configured reference range.",
    }


def analyze_vitals(
    heart_rate: Any = None,
    respiratory_rate: Any = None,
    oxygen_saturation: Any = None,
    systolic_bp: Any = None,
    diastolic_bp: Any = None,
    temperature: Any = None,
) -> dict[str, Any]:
    """
    Analyze a collection of patient vital signs.

    The configured thresholds are screening/reference rules only
    and are not a clinical diagnosis.
    """
    analyses = {
        "heart_rate": analyze_heart_rate(
            heart_rate
        ),
        "respiratory_rate": analyze_respiratory_rate(
            respiratory_rate
        ),
        "oxygen_saturation": analyze_oxygen_saturation(
            oxygen_saturation
        ),
        "blood_pressure": analyze_blood_pressure(
            systolic_bp,
            diastolic_bp,
        ),
        "temperature": analyze_temperature(
            temperature
        ),
    }

    abnormal = []

    for vital_name, result in analyses.items():
        if result["status"] not in {
            "normal",
            "unknown",
        }:
            abnormal.append(
                {
                    "vital": vital_name,
                    "status": result["status"],
                    "message": result["message"],
                }
            )

    critical = any(
        item["status"] == "critical"
        for item in abnormal
    )

    if critical:
        overall_status = "critical"
    elif abnormal:
        overall_status = "abnormal"
    elif all(
        result["status"] == "unknown"
        for result in analyses.values()
    ):
        overall_status = "unknown"
    else:
        overall_status = "normal"

    return {
        "overall_status": overall_status,
        "abnormal_findings": abnormal,
        "vitals": analyses,
    }
