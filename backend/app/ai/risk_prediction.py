from __future__ import annotations

from typing import Any

from app.ai.model_loader import load_model
from app.ai.preprocessing import build_feature_array, clamp, to_numeric


RISK_MODEL_NAME = "patient_risk_model.joblib"


def _fallback_risk_score(
    age: Any = 0,
    heart_rate: Any = 0,
    respiratory_rate: Any = 0,
    oxygen_saturation: Any = 100,
    systolic_bp: Any = 120,
    temperature: Any = 37.0,
) -> float:
    """
    Deterministic fallback risk calculation.

    This is a rule-based fallback used only when no trained model
    is available. It is not a clinical diagnosis.
    """
    score = 0.0

    age_value = to_numeric(age)
    heart_rate_value = to_numeric(heart_rate)
    respiratory_value = to_numeric(respiratory_rate)
    oxygen_value = to_numeric(oxygen_saturation, 100)
    systolic_value = to_numeric(systolic_bp, 120)
    temperature_value = to_numeric(temperature, 37.0)

    if age_value >= 65:
        score += 15
    elif age_value >= 45:
        score += 8

    if heart_rate_value >= 120 or heart_rate_value < 50:
        score += 15
    elif heart_rate_value >= 100:
        score += 8

    if respiratory_value >= 30 or respiratory_value < 10:
        score += 15
    elif respiratory_value >= 22:
        score += 8

    if oxygen_value < 90:
        score += 25
    elif oxygen_value < 94:
        score += 15

    if systolic_value < 90:
        score += 20
    elif systolic_value < 100:
        score += 10

    if temperature_value >= 39.0 or temperature_value < 35.0:
        score += 15
    elif temperature_value >= 38.0:
        score += 8

    return clamp(
        score,
        0.0,
        100.0,
    )


def _risk_category(
    score: float,
) -> str:
    if score >= 70:
        return "high"

    if score >= 40:
        return "moderate"

    return "low"


def predict_patient_risk(
    age: Any = 0,
    heart_rate: Any = 0,
    respiratory_rate: Any = 0,
    oxygen_saturation: Any = 100,
    systolic_bp: Any = 120,
    temperature: Any = 37.0,
) -> dict[str, Any]:
    """
    Predict patient risk using the trained ML model when available.

    Falls back to a deterministic rule-based score when the trained
    model file is not present.
    """
    features = build_feature_array(
        [
            age,
            heart_rate,
            respiratory_rate,
            oxygen_saturation,
            systolic_bp,
            temperature,
        ]
    )

    model = load_model(RISK_MODEL_NAME)

    if model is not None:
        try:
            prediction = model.predict(features)

            raw_prediction = prediction[0]

            probability = None

            if hasattr(model, "predict_proba"):
                probabilities = model.predict_proba(features)

                if len(probabilities) > 0:
                    probability = float(
                        max(probabilities[0])
                    )

            if isinstance(raw_prediction, str):
                category = raw_prediction.lower()
            else:
                category = (
                    "high"
                    if int(raw_prediction) == 1
                    else "low"
                )

            score = (
                probability * 100
                if probability is not None
                else (
                    100.0
                    if category == "high"
                    else 0.0
                )
            )

            return {
                "risk_score": round(
                    clamp(score, 0.0, 100.0),
                    2,
                ),
                "risk_category": category,
                "source": "machine_learning_model",
                "model_available": True,
            }

        except Exception:
            # Fall through to the deterministic fallback.
            pass

    score = _fallback_risk_score(
        age=age,
        heart_rate=heart_rate,
        respiratory_rate=respiratory_rate,
        oxygen_saturation=oxygen_saturation,
        systolic_bp=systolic_bp,
        temperature=temperature,
    )

    return {
        "risk_score": round(score, 2),
        "risk_category": _risk_category(score),
        "source": "rule_based_fallback",
        "model_available": False,
    }


def get_risk_summary(
    **vitals: Any,
) -> str:
    """Return a human-readable risk summary."""
    result = predict_patient_risk(**vitals)

    return (
        f"Risk category: {result['risk_category']}; "
        f"risk score: {result['risk_score']}/100; "
        f"source: {result['source']}."
    )
