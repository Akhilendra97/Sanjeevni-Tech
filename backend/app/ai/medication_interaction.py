from __future__ import annotations

from typing import Any


# Rule-based interaction registry.
# Each pair is stored alphabetically to make lookup deterministic.
KNOWN_INTERACTIONS: dict[tuple[str, str], dict[str, Any]] = {
    (
        "aspirin",
        "warfarin",
    ): {
        "severity": "high",
        "effect": "Increased bleeding risk.",
        "recommendation": (
            "Review the combination with the treating clinician "
            "and monitor according to the prescribed care plan."
        ),
    },
    (
        "ibuprofen",
        "warfarin",
    ): {
        "severity": "high",
        "effect": "Increased bleeding risk.",
        "recommendation": (
            "Review the combination with the treating clinician "
            "before concurrent use."
        ),
    },
    (
        "clarithromycin",
        "simvastatin",
    ): {
        "severity": "high",
        "effect": (
            "Clarithromycin can increase simvastatin exposure "
            "and may increase the risk of muscle toxicity."
        ),
        "recommendation": (
            "Review the combination with the treating clinician "
            "and follow the prescribed medication plan."
        ),
    },
    (
        "contrast media",
        "metformin",
    ): {
        "severity": "moderate",
        "effect": (
            "Iodinated contrast procedures may require "
            "specific medication management."
        ),
        "recommendation": (
            "Follow the facility's medication and contrast "
            "procedure protocol."
        ),
    },
}


def _normalize_medicine_name(
    name: str,
) -> str:
    return " ".join(
        name.strip().lower().split()
    )


def _interaction_key(
    medicine_a: str,
    medicine_b: str,
) -> tuple[str, str]:
    normalized_a = _normalize_medicine_name(
        medicine_a
    )

    normalized_b = _normalize_medicine_name(
        medicine_b
    )

    return tuple(
        sorted(
            [
                normalized_a,
                normalized_b,
            ]
        )
    )


def check_pair_interaction(
    medicine_a: str,
    medicine_b: str,
) -> dict[str, Any]:
    """
    Check a single medication pair.

    Unknown combinations are explicitly returned as unknown.
    They must not be interpreted as clinically safe.
    """
    if not medicine_a.strip() or not medicine_b.strip():
        return {
            "medicine_a": medicine_a,
            "medicine_b": medicine_b,
            "status": "unknown",
            "severity": "unknown",
            "message": "Both medicine names are required.",
        }

    if (
        _normalize_medicine_name(medicine_a)
        == _normalize_medicine_name(medicine_b)
    ):
        return {
            "medicine_a": medicine_a,
            "medicine_b": medicine_b,
            "status": "duplicate",
            "severity": "moderate",
            "message": "The same medicine was supplied twice.",
        }

    key = _interaction_key(
        medicine_a,
        medicine_b,
    )

    interaction = KNOWN_INTERACTIONS.get(key)

    if interaction is None:
        return {
            "medicine_a": medicine_a,
            "medicine_b": medicine_b,
            "status": "unknown",
            "severity": "unknown",
            "message": (
                "No interaction rule is available for "
                "this medication pair."
            ),
        }

    return {
        "medicine_a": medicine_a,
        "medicine_b": medicine_b,
        "status": "interaction_found",
        "severity": interaction["severity"],
        "effect": interaction["effect"],
        "recommendation": interaction["recommendation"],
    }


def check_medication_interactions(
    medicines: list[str],
) -> dict[str, Any]:
    """Check all unique pairs in a medication list."""
    normalized_medicines = [
        medicine.strip()
        for medicine in medicines
        if medicine and medicine.strip()
    ]

    results: list[dict[str, Any]] = []

    for index, medicine_a in enumerate(
        normalized_medicines
    ):
        for medicine_b in normalized_medicines[
            index + 1 :
        ]:
            results.append(
                check_pair_interaction(
                    medicine_a,
                    medicine_b,
                )
            )

    interactions_found = [
        result
        for result in results
        if result["status"] == "interaction_found"
    ]

    unknown_pairs = [
        result
        for result in results
        if result["status"] == "unknown"
    ]

    duplicate_pairs = [
        result
        for result in results
        if result["status"] == "duplicate"
    ]

    severity_order = {
        "high": 3,
        "moderate": 2,
        "low": 1,
        "unknown": 0,
    }

    highest_severity = "none"

    for result in interactions_found:
        severity = result["severity"]

        if severity_order.get(
            severity,
            0,
        ) > severity_order.get(
            highest_severity,
            0,
        ):
            highest_severity = severity

    return {
        "medicine_count": len(
            normalized_medicines
        ),
        "pair_count": len(results),
        "interactions_found": len(
            interactions_found
        ),
        "unknown_pairs": len(
            unknown_pairs
        ),
        "duplicate_pairs": len(
            duplicate_pairs
        ),
        "highest_severity": highest_severity,
        "results": results,
    }


def get_high_risk_interactions(
    medicines: list[str],
) -> list[dict[str, Any]]:
    """Return only high-severity known interactions."""
    analysis = check_medication_interactions(
        medicines
    )

    return [
        result
        for result in analysis["results"]
        if result.get("severity") == "high"
    ]

