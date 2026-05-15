from __future__ import annotations

import json
import re
from pathlib import Path


BASE_DIR = Path(__file__).resolve().parent
MODELS_DIR = BASE_DIR / "models"


def _model_file(name: str) -> Path:
    path = MODELS_DIR / name
    if path.exists():
        return path
    matches = sorted(MODELS_DIR.glob(f"{Path(name).stem}*.json"))
    if matches:
        return matches[0]
    return path


def _load_symptoms() -> list[str]:
    with _model_file("symptoms_list.json").open("r", encoding="utf-8") as file:
        return json.load(file)


SYMPTOMS = _load_symptoms()
SYMPTOM_SET = set(SYMPTOMS)

SYMPTOM_SYNONYMS = {
    "breathing difficulty": "breathlessness",
    "breathing problem": "breathlessness",
    "difficulty breathing": "breathlessness",
    "shortness of breath": "breathlessness",
    "heart racing": "fast_heart_rate",
    "rapid heartbeat": "fast_heart_rate",
    "high temperature": "high_fever",
    "fever": "high_fever",
    "loose motion": "diarrhoea",
    "loose motions": "diarrhoea",
    "stomach ache": "stomach_pain",
    "tummy ache": "stomach_pain",
    "belly ache": "belly_pain",
    "throwing up": "vomiting",
    "puking": "vomiting",
    "feel dizzy": "dizziness",
    "feeling dizzy": "dizziness",
    "body pain": "muscle_pain",
    "weakness": "fatigue",
}

NEGATION_WORDS = {
    "no",
    "not",
    "without",
    "denies",
    "deny",
    "never",
}


def _preprocess(text: str) -> str:
    text = text.lower()
    text = re.sub(r"[^a-z0-9\s_]", " ", text)
    return re.sub(r"\s+", " ", text).strip()


def _is_negated(cleaned_text: str, start_index: int) -> bool:
    before = cleaned_text[:start_index].split()[-5:]
    before_text = " ".join(before)
    return (
        any(word in NEGATION_WORDS for word in before)
        or "do not have" in before_text
        or "don't have" in before_text
        or "does not have" in before_text
    )


def _add_symptom(symptoms: list[str], symptom: str) -> None:
    if symptom in SYMPTOM_SET:
        symptom_text = symptom.replace("_", " ")
        if symptom_text not in symptoms:
            symptoms.append(symptom_text)


def _extract_by_exact_match(cleaned_text: str) -> list[str]:
    matched_symptoms: list[str] = []

    for symptom in SYMPTOMS:
        symptom_text = symptom.replace("_", " ").lower()
        pattern = rf"(?<!\w){re.escape(symptom_text)}(?!\w)"
        for match in re.finditer(pattern, cleaned_text):
            if not _is_negated(cleaned_text, match.start()):
                _add_symptom(matched_symptoms, symptom)
                break

    for phrase, symptom in SYMPTOM_SYNONYMS.items():
        pattern = rf"(?<!\w){re.escape(phrase)}(?!\w)"
        for match in re.finditer(pattern, cleaned_text):
            if not _is_negated(cleaned_text, match.start()):
                _add_symptom(matched_symptoms, symptom)
                break

    return matched_symptoms


def _extract_by_tfidf(cleaned_text: str) -> list[str]:
    try:
        from sklearn.feature_extraction.text import TfidfVectorizer
        from sklearn.metrics.pairwise import cosine_similarity
    except ImportError:
        return []

    symptom_texts = [symptom.replace("_", " ") for symptom in SYMPTOMS]
    vectorizer = TfidfVectorizer(ngram_range=(1, 3))
    matrix = vectorizer.fit_transform(symptom_texts + [cleaned_text])
    scores = cosine_similarity(matrix[-1], matrix[:-1]).ravel()

    if scores.size == 0:
        return []

    best_index = int(scores.argmax())
    if scores[best_index] < 0.45:
        return []

    return [SYMPTOMS[best_index].replace("_", " ")]


def extract_symptoms(text: str) -> list[str]:
    cleaned_text = _preprocess(text)
    matched_symptoms = _extract_by_exact_match(cleaned_text)

    if matched_symptoms:
        return matched_symptoms

    return _extract_by_tfidf(cleaned_text)


def run_nlp_pipeline(text: str) -> list[str]:
    return extract_symptoms(text)
