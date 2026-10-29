from __future__ import annotations

from typing import Any


SYMPTOM_RULES: dict[str, dict[str, Any]] = {
    "chest pain": {
        "category": "cardiovascular",
        "urgency": "emergency",
        "department": "Emergency",
        "message": "Chest pain may require urgent medical assessment.",
        "next_step": "Seek immediate medical evaluation, especially if pain is severe or associated with breathing difficulty, sweating, fainting, or weakness.",
    },
    "difficulty breathing": {
        "category": "respiratory",
        "urgency": "emergency",
        "department": "Emergency",
        "message": "Difficulty breathing can require urgent assessment.",
        "next_step": "Seek immediate medical evaluation if breathing difficulty is severe, sudden, or worsening.",
    },
    "shortness of breath": {
        "category": "respiratory",
        "urgency": "urgent",
        "department": "Emergency",
        "message": "Shortness of breath should be clinically assessed.",
        "next_step": "Arrange prompt medical assessment, and seek emergency care if symptoms are severe or rapidly worsening.",
    },
    "severe headache": {
        "category": "neurological",
        "urgency": "urgent",
        "department": "Neurology",
        "message": "A severe headache may require prompt clinical assessment.",
        "next_step": "Seek prompt medical evaluation, particularly if the headache is sudden, unusual, or associated with neurological symptoms.",
    },
    "fainting": {
        "category": "neurological",
        "urgency": "urgent",
        "department": "Emergency",
        "message": "Fainting should be clinically assessed.",
        "next_step": "Arrange prompt medical evaluation and seek emergency care if recovery is incomplete or other serious symptoms are present.",
    },
    "fever": {
        "category": "infectious",
        "urgency": "routine",
        "department": "General Medicine",
        "message": "Fever can have many causes and should be assessed in context.",
        "next_step": "Monitor the temperature and seek clinical assessment if fever is persistent, high, or accompanied by concerning symptoms.",
    },
    "cough": {
        "category": "respiratory",
        "urgency": "routine",
        "department": "General Medicine",
        "message": "Cough can have several possible causes.",
        "next_step": "Clinical assessment may be appropriate if the cough is persistent, worsening, or associated with breathing difficulty.",
    },
    "vomiting": {
        "category": "gastrointestinal",
        "urgency": "routine",
        "department": "General Medicine",
        "message": "Vomiting can result from several conditions.",
        "next_step": "Seek clinical assessment if vomiting persists or there are signs of dehydration, severe pain, or other concerning symptoms.",
    },
    "abdominal pain": {
        "category": "gastrointestinal",
        "urgency": "urgent",
        "department": "General Medicine",
        "message": "Abdominal pain should be assessed according to severity and associated symptoms.",
        "next_step": "Seek prompt clinical assessment if pain is severe, persistent, worsening, or associated with vomiting, bleeding, or fainting.",
    },
    "diarrhea": {
        "category": "gastrointestinal",
        "urgency": "routine",
        "department": "General Medicine",
        "message": "Diarrhea can have multiple causes and may lead to dehydration.",
        "next_step": "Seek clinical assessment if symptoms are persistent, severe, or associated with dehydration or blood in stool.",
    },
    "rash": {
        "category": "dermatological",
        "urgency": "routine",
        "department": "Dermatology",
        "message": "Skin rashes have many possible causes.",
        "next_step": "Arrange clinical assessment if the rash is persistent, spreading, painful, or associated with other concerning symptoms.",
    },
    "joint pain": {
        "category": "musculoskeletal",
        "urgency": "routine",
        "department": "Orthopedics",
        "message": "Joint pain can have multiple causes.",
        "next_step": "Clinical assessment may help determine the underlying cause if pain persists or limits movement.",
    },
    "back pain": {
        "category": "musculoskeletal",
        "urgency": "routine",
        "department": "Orthopedics",
        "message": "Back pain can have several possible causes.",
        "next_step": "Seek clinical assessment if pain is persistent, severe, follows an injury, or is associated with weakness or other concerning symptoms.",
    },
    "toothache": {
        "category": "dental",
        "urgency": "routine",
        "department": "Dental",
        "message": "Tooth pain should be assessed by a dental professional.",
        "next_step": "Arrange a dental evaluation, especially if pain is persistent or associated with swelling or fever.",
    },
}


def _normalize_symptom(symptom: str) -> str:
    return " ".join(symptom.strip().lower().split())


def _find_matching_rule(symptom: str) -> tuple[str | None, dict[str, Any] | None]:
    normalized = _normalize_symptom(symptom)

    if not normalized:
        return None, None

    if normalized in SYMPTOM_RULES:
        return normalized, SYMPTOM_RULES[normalized]

    for known_symptom, rule in SYMPTOM_RULES.items():
        if known_symptom in normalized or normalized in known_symptom:
            return known_symptom, rule

    return None, None


def analyze_symptom(symptom: str) -> dict[str, Any]:
    """
    Provide a rule-based symptom screening result.

    This utility does not diagnose diseases. It only maps recognized
    symptoms to a configured urgency level and suggested department.
    """
    normalized = _normalize_symptom(symptom)

    if not normalized:
        return {
            "symptom": symptom,
            "normalized_symptom": "",
            "status": "unknown",
            "urgency": "unknown",
            "category": "unknown",
            "department": "unknown",
            "message": "A symptom is required.",
            "next_step": "Provide a symptom for screening.",
        }

    matched_symptom, rule = _find_matching_rule(normalized)

    if rule is None:
        return {
            "symptom": symptom,
            "normalized_symptom": normalized,
            "matched_symptom": None,
            "status": "unknown",
            "urgency": "unknown",
            "category": "unknown",
            "department": "General Medicine",
            "message": "No configured screening rule is available for this symptom.",
            "next_step": "Seek assessment from a qualified healthcare professional.",
        }

    return {
        "symptom": symptom,
        "normalized_symptom": normalized,
        "matched_symptom": matched_symptom,
        "status": "recognized",
        "urgency": rule["urgency"],
        "category": rule["category"],
        "department": rule["department"],
        "message": rule["message"],
        "next_step": rule["next_step"],
    }


def analyze_symptoms(symptoms: list[str]) -> dict[str, Any]:
    """
    Analyze multiple symptoms and return an aggregated screening summary.
    """
    cleaned_symptoms = [
        symptom.strip()
        for symptom in symptoms
        if symptom and symptom.strip()
    ]

    results = [analyze_symptom(symptom) for symptom in cleaned_symptoms]

    urgency_order = {
        "emergency": 3,
        "urgent": 2,
        "routine": 1,
        "unknown": 0,
    }

    highest_urgency = "unknown"

    for result in results:
        urgency = result["urgency"]
        if urgency_order.get(urgency, 0) > urgency_order.get(
            highest_urgency,
            0,
        ):
            highest_urgency = urgency

    recognized_results = [
        result
        for result in results
        if result["status"] == "recognized"
    ]

    unknown_results = [
        result
        for result in results
        if result["status"] == "unknown"
    ]

    departments = []
    for result in recognized_results:
        department = result["department"]
        if department not in departments:
            departments.append(department)

    return {
        "symptom_count": len(cleaned_symptoms),
        "recognized_count": len(recognized_results),
        "unknown_count": len(unknown_results),
        "highest_urgency": highest_urgency,
        "suggested_departments": departments,
        "results": results,
    }


def get_emergency_symptoms(symptoms: list[str]) -> list[dict[str, Any]]:
    """
    Return only symptoms mapped to emergency urgency.
    """
    analysis = analyze_symptoms(symptoms)

    return [
        result
        for result in analysis["results"]
        if result["urgency"] == "emergency"
    ]


def get_symptom_summary(symptoms: list[str]) -> str:
    """
    Generate a concise human-readable screening summary.
    """
    analysis = analyze_symptoms(symptoms)

    if analysis["symptom_count"] == 0:
        return "No symptoms were provided."

    departments = ", ".join(analysis["suggested_departments"]) or "General Medicine"

    return (
        f"Recognized {analysis['recognized_count']} of "
        f"{analysis['symptom_count']} symptoms. "
        f"Highest urgency: {analysis['highest_urgency']}. "
        f"Suggested department(s): {departments}."
    )
