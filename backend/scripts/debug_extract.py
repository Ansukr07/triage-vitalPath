import re

ENTITY_BLACKLIST = {
    "date", "phone", "time", "note", "none", "done", "result", "normal", 
    "abnormal", "urine", "blood", "patient", "hospital", "doctor", "report",
    "emergency", "contact", "follow", "advice", "instructions", "detail",
}

MEDICATION_KEYWORDS = [
    r"\b(?!(?:Date|Phone|Time|Note|Urine|Daily|Twice|None|Result)\b)\w+(?:cillin|mycin|floxacin|prazole|sartan|olol|pril|statin|azole|mab|nib|ide|ine|ate|one)\b",
    r"\bmetformin\b",
]

def _regex_extract(text, patterns):
    found = set()
    lower_text = text.lower()
    for pat in patterns:
        for m in re.finditer(pat, text, re.IGNORECASE):
            original = text[m.start():m.end()]
            val = original.strip()
            print(f"DEBUG: Found '{val}', lower: '{val.lower()}', in blacklist: {val.lower() in ENTITY_BLACKLIST}")
            if val.lower() not in ENTITY_BLACKLIST and len(val) > 2:
                found.add(val)
    return sorted(found)

test_text = "Medications: Date, None, done, urine, Metformin"
results = _regex_extract(test_text, MEDICATION_KEYWORDS)
print(f"Results: {results}")
