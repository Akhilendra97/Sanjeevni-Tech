from __future__ import annotations

from typing import Any

from app.ai.preprocessing import to_numeric


def analyze_lab_value(
    test_name: str,
    value: Any,
    reference_low: Any = None,
    reference_high: Any = None,
    critical_low: Any = None,
    critical_high: Any = None,
) -> dict[str, Any]:
    """
    Analyze a laboratory value against supplied reference ranges.

    Reference ranges must come from the laboratory/test configuration.
    This function does not invent patient-specific clinical ranges.
    """
    numeric_value = to_numeric(
        value,
        default=float("nan"),
    )

    if numeric_value != numeric_value:
        return {
            "test_name": test_name,
            "value": value,
            "status": "unknown",
            "message": "Numeric laboratory value is unavailable.",
        }

    low = (
        to_numeric(reference_low)
        if reference_low is not None
        else None
    )

    high = (
        to_numeric(reference_high)
        if reference_high is not None
        else None
    )

    critical_low_value = (
        to_numeric(critical_low)
        if critical_low is not None
        else None
    )

    critical_high_value = (
        to_numeric(critical_high)
        if critical_high is not None
        else None
    )

    if (
        critical_low_value is not None
        and numeric_value < critical_low_value
    ):
        status = "critical"
        message = "Laboratory value is critically low."

    elif (
        critical_high_value is not None
        and numeric_value > critical_high_value
    ):
        status = "critical"
        message = "Laboratory value is critically high."

    elif low is not None and numeric_value < low:
        status = "low"
        message = "Laboratory value is below the supplied reference range."

    elif high is not None and numeric_value > high:
        status = "high"
        message = "Laboratory value is above the supplied reference range."

    elif low is None and high is None:
        status = "unknown"
        message = "No reference range was supplied."

    else:
        status = "normal"
        message = "Laboratory value is within the supplied reference range."

    return {
        "test_name": test_name,
        "value": numeric_value,
        "reference_low": low,
        "reference_high": high,
        "status": status,
        "message": message,
    }


def analyze_lab_results(
    results: list[dict[str, Any]],
) -> dict[str, Any]:
    """
    Analyze multiple laboratory results.

    Each result should contain:
        test_name
        value
        reference_low
        reference_high

    Optional:
        critical_low
        critical_high
    """
    analyses: list[dict[str, Any]] = []

    for result in results:
        analyses.append(
            analyze_lab_value(
                test_name=str(
                    result.get(
                        "test_name",
                        "Unknown test",
                    )
                ),
                value=result.get("value"),
                reference_low=result.get(
                    "reference_low"
                ),
                reference_high=result.get(
                    "reference_high"
                ),
                critical_low=result.get(
                    "critical_low"
                ),
                critical_high=result.get(
                    "critical_high"
                ),
            )
        )

    critical_count = sum(
        item["status"] == "critical"
        for item in analyses
    )

    abnormal_count = sum(
        item["status"] in {
            "low",
            "high",
            "critical",
        }
        for item in analyses
    )

    unknown_count = sum(
        item["status"] == "unknown"
        for item in analyses
    )

    if critical_count > 0:
        overall_status = "critical"
    elif abnormal_count > 0:
        overall_status = "abnormal"
    elif not analyses or unknown_count == len(analyses):
        overall_status = "unknown"
    else:
        overall_status = "normal"

    return {
        "overall_status": overall_status,
        "total_tests": len(analyses),
        "abnormal_count": abnormal_count,
        "critical_count": critical_count,
        "unknown_count": unknown_count,
        "results": analyses,
    }


def get_abnormal_results(
    results: list[dict[str, Any]],
) -> list[dict[str, Any]]:
    """Return only abnormal and critical laboratory results."""
    analysis = analyze_lab_results(results)

    return [
        result
        for result in analysis["results"]
        if result["status"]
        in {
            "low",
            "high",
            "critical",
        }
    ]
