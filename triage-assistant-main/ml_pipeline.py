from __future__ import annotations

import json
import sys
from pathlib import Path

import joblib
import numpy as np


BASE_DIR = Path(__file__).resolve().parent
MODELS_DIR = BASE_DIR / "models"


def _model_file(name: str) -> Path:
    path = MODELS_DIR / name
    if path.exists():
        return path
    if path.suffix == ".json":
        matches = sorted(MODELS_DIR.glob(f"{path.stem}*.json"))
        if matches:
            return matches[0]
    return path


def _load_json(name: str):
    with _model_file(name).open("r", encoding="utf-8") as file:
        return json.load(file)


def _load_pickle(name: str):
    return joblib.load(MODELS_DIR / name)


TRIAGE_CLASSIFIER = _load_pickle("triage_classifier.pkl")
RISK_SCORE_REGRESSOR = _load_pickle("risk_score_regressor.pkl")
EMERGENCY_DETECTOR = _load_pickle("emergency_detector.pkl")

SYMPTOMS = _load_json("symptoms_list.json")
SEVERITY_DICT = _load_json("severity_dict.json")
FEATURE_NAMES = _load_json("feature_names.json")


def _normalize_symptom(symptom: str) -> str:
    return symptom.strip().lower().replace(" ", "_")


def symptoms_to_feature_vector(symptoms: list[str]) -> np.ndarray:
    normalized_symptoms = {_normalize_symptom(symptom) for symptom in symptoms}
    severity_scores = [
        float(SEVERITY_DICT.get(symptom, 0))
        for symptom in normalized_symptoms
    ]

    feature_values = {
        symptom: 1.0 if symptom in normalized_symptoms else 0.0
        for symptom in SYMPTOMS
    }
    feature_values["total_severity_score"] = float(sum(severity_scores))
    feature_values["symptom_count"] = float(len(normalized_symptoms))
    feature_values["max_symptom_severity"] = float(max(severity_scores) if severity_scores else 0.0)
    feature_values["avg_symptom_severity"] = float(
        sum(severity_scores) / len(severity_scores) if severity_scores else 0.0
    )
    feature_values["high_risk_flag"] = float(any(score >= 7 for score in severity_scores))

    vector = [feature_values.get(feature_name, 0.0) for feature_name in FEATURE_NAMES]
    return np.array(vector, dtype=float).reshape(1, -1)


def run_ml_pipeline(symptoms: list[str]) -> dict:
    feature_vector = symptoms_to_feature_vector(symptoms)

    triage_prediction = TRIAGE_CLASSIFIER.predict(feature_vector)[0]
    risk_score_prediction = RISK_SCORE_REGRESSOR.predict(feature_vector)[0]
    emergency_prediction = EMERGENCY_DETECTOR.predict(feature_vector)[0]

    return {
        "triage": str(triage_prediction),
        "risk_score": float(risk_score_prediction),
        "emergency": bool(emergency_prediction),
    }


if __name__ == "__main__":
    from nlp_pipeline import run_nlp_pipeline

    text = " ".join(sys.argv[1:]) or input("Enter symptoms: ")
    symptoms = run_nlp_pipeline(text)
    print(json.dumps(run_ml_pipeline(symptoms), indent=2))

run_ml_pipeline(["chest pain", "shortness of breath", "dizziness"])
