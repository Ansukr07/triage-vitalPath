from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from transformers import AutoTokenizer, AutoModelForMaskedLM
import torch
import uvicorn
from typing import List, Optional
import re
import os
import io

# OCR / PDF Processing
try:
    import fitz  # PyMuPDF
    import easyocr
    import numpy as np
    from PIL import Image
    HAS_OCR = True
    print("OCR dependencies (easyocr, pymupdf) loaded")
except ImportError as e:
    HAS_OCR = False
    print(f"OCR dependencies missing: {e}. OCR will be unavailable.")

app = FastAPI(title="VitalPath ClinicalBERT Service")

# ──────────────────────────────────────────────
# Model Loading
# ──────────────────────────────────────────────
MODEL_NAME = "medicalai/ClinicalBERT"

print(f"Loading ClinicalBERT model: {MODEL_NAME}...")
try:
    tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
    model = AutoModelForMaskedLM.from_pretrained(MODEL_NAME)
    print("ClinicalBERT model loaded successfully")
except Exception as e:
    print(f"Error loading ClinicalBERT: {e}")
    tokenizer = None
    model = None

# Initialize EasyOCR Reader
reader = None
if HAS_OCR:
    try:
        print("Initializing EasyOCR Reader (English)...")
        reader = easyocr.Reader(['en'])
        print("EasyOCR Reader initialized")
    except Exception as e:
        print(f"Error initializing EasyOCR: {e}")
        reader = None

# Try loading scispacy for proper biomedical NER
nlp_ner = None
try:
    import spacy
    nlp_ner = spacy.load("en_ner_bc5cdr_md")
    print("scispacy NER model (en_ner_bc5cdr_md) loaded")
except Exception:
    try:
        import spacy
        nlp_ner = spacy.load("en_core_web_sm")
        print("scispacy not found, using en_core_web_sm as fallback NER")
    except Exception as e2:
        print(f"No spaCy model available, using regex-based extraction: {e2}")
        nlp_ner = None

# ──────────────────────────────────────────────
# Global Clinical Filters
# ──────────────────────────────────────────────
# Common words that are often misidentified as clinical entities in reports
ENTITY_BLACKLIST = {
    "date", "phone", "time", "note", "none", "done", "result", "normal", 
    "abnormal", "urine", "blood", "patient", "hospital", "doctor", "report",
    "emergency", "contact", "follow", "advice", "instructions", "detail",
    "observation", "summary", "daily", "twice", "once", "three", "four",
    "observed", "present", "noted", "detected", "clinical", "medical"
}

# Sections that typically contain instructions/advisory rather than findings
ADVISORY_PREFIXES = [
    r"in case you observe",
    r"if you experience",
    r"contact if",
    r"report to emergency",
    r"nb\b",
    r"nota bene",
    r"disclaimer",
    r"instructions for patient",
    r"advice and precautions",
    r"warning signs",
]

# ──────────────────────────────────────────────
# Clinical Keyword Banks (regex-based fallback)
# ──────────────────────────────────────────────
SYMPTOM_KEYWORDS = [
    r"\bpain\b", r"\bache\b", r"\bfever\b", r"\bnausea\b", r"\bvomiting\b",
    r"\bdizziness\b", r"\bfatigue\b", r"\bweakness\b", r"\bcough\b",
    r"\bshortness of breath\b", r"\bdyspnea\b", r"\bchest pain\b", r"\bheadache\b",
    r"\bswelling\b", r"\bedema\b", r"\bpalpitations\b", r"\btachycardia\b",
    r"\bbradycardia\b", r"\bhypertension\b", r"\bhypotension\b", r"\bdiarrhea\b",
    r"\bconstipation\b", r"\banorexia\b", r"\binsomnia\b", r"\bmalaise\b",
    r"\bchills\b", r"\bnight sweats\b", r"\bweight loss\b", r"\bweight gain\b",
    r"\bpruritus\b", r"\brash\b", r"\bjaundice\b", r"\bsyncope\b",
    r"\bseizure\b", r"\btremor\b", r"\balopecia\b", r"\bdysphagia\b",
    r"\bblurred vision\b", r"\btinnitus\b", r"\bhematuria\b", r"\bdysuria\b",
    r"\bpolyuria\b", r"\bpolydipsia\b", r"\bback pain\b", r"\bjoint pain\b",
    r"\barthr(?:algia|itis)\b", r"\bmyalgia\b", r"\blethargy\b",
    r"\bconfusion\b", r"\banxiety\b", r"\bdepression\b", r"\bparasthesia\b",
]

MEDICATION_KEYWORDS = [
    # Common drug suffixes (broad catch) - further restricted
    r"\b(?!(?:Date|Phone|Time|Note|Urine|Daily|Twice|None|Result)\b)\w+(?:cillin|mycin|floxacin|prazole|sartan|olol|pril|statin|azole|mab|nib|ide|ine|ate|one)\b",
    # Specific common drugs
    r"\bmetformin\b", r"\binsulin\b", r"\baspirin\b", r"\bibuprofen\b",
    r"\bparacetamol\b", r"\bacetaminophen\b", r"\blisinopril\b", r"\batorvastatin\b",
    r"\brosuvastatin\b", r"\bmetoprolol\b", r"\bamlodipine\b", r"\bomeprazole\b",
    r"\bpantoprazole\b", r"\bclopidogrel\b", r"\bwarfarin\b", r"\bapixaban\b",
    r"\brivaroxaban\b", r"\bfurosemide\b", r"\bspironolactone\b",
    r"\blevothyroxine\b", r"\balbuterol\b", r"\bsalbutamol\b",
    r"\bprednisone\b", r"\bdexamethasone\b", r"\bhydrochlorothiazide\b",
    r"\bglipizide\b", r"\bglyburide\b", r"\bsitagliptin\b", r"\bempagliflozin\b",
    r"\bamoxicillin\b", r"\bazithromycin\b", r"\bdoxycycline\b",
    r"\bcetirizine\b", r"\bloratadine\b", r"\bmontelukast\b",
    r"\bsertraline\b", r"\bescitalopram\b", r"\bfluoxetine\b",
    r"\balprazolam\b", r"\bclonazepam\b", r"\bzolpidem\b",
    r"\bgabapentin\b", r"\bpregabalin\b", r"\btramadol\b",
    r"\bmorphine\b", r"\boxcycodone\b", r"\bcodeine\b",
    r"\bvitamin [a-zA-Z]\d*\b", r"\bvitamin [a-zA-Z]\b",
    r"\bcalcium\b", r"\bmagnesium\b", r"\biron\b", r"\bferrous\b",
]

CONDITION_KEYWORDS = [
    r"\bdiabetes\b", r"\bhypertension\b", r"\bhyperlipidemia\b",
    r"\bhypercholesterolemia\b", r"\bcoronary artery disease\b", r"\bcad\b",
    r"\bheart failure\b", r"\batrial fibrillation\b", r"\basthma\b",
    r"\bcopd\b", r"\bpneumonia\b", r"\btuberculosis\b", r"\banemia\b",
    r"\bthyroid\b", r"\bhypothyroidism\b", r"\bhyperthyroidism\b",
    r"\bkidney disease\b", r"\brenal failure\b", r"\bckd\b",
    r"\bliver disease\b", r"\bhepatitis\b", r"\bcirrhosis\b",
    r"\bcancer\b", r"\btumor\b", r"\bmalignancy\b", r"\bcarcinoma\b",
    r"\blymphoma\b", r"\bleukemia\b", r"\bstroke\b", r"\binfarction\b",
    r"\bischemia\b", r"\binfection\b", r"\bsepsis\b", r"\bgout\b",
    r"\bosteoporosis\b", r"\bosteoarthritis\b", r"\brheumatoid\b",
    r"\blupus\b", r"\bsle\b", r"\bpsoriasis\b", r"\beczema\b",
    r"\bepileps[yi]\b", r"\bmigraine\b", r"\bparkinson\b",
    r"\balzheimer\b", r"\bdement[ai]\b", r"\bdepressive disorder\b",
    r"\banxiety disorder\b", r"\bschizophrenia\b", r"\bbipolar\b",
    r"\bgastritis\b", r"\bgerd\b", r"\bcrohn\b", r"\bibs\b",
    r"\bcolitis\b", r"\bappendici[t]is\b", r"\bpancreatitis\b",
    r"\bpyelonephritis\b", r"\burinary tract infection\b", r"\buti\b",
    r"\bdeep vein thrombosis\b", r"\bdvt\b", r"\bpulmonary embolism\b",
]

TEST_KEYWORDS = [
    r"\bcbc\b", r"\bcomplete blood count\b", r"\bhemoglobin\b", r"\bwbc\b",
    r"\bplatelet\b", r"\bhematocrit\b", r"\bcreatinine\b", r"\bbun\b",
    r"\bblood urea nitrogen\b", r"\bglucose\b", r"\bhba1c\b",
    r"\blipid panel\b", r"\bcholesterol\b", r"\btriglycerides\b",
    r"\bldl\b", r"\bhdl\b", r"\bvldl\b", r"\blast\b", r"\balt\b",
    r"\balbumin\b", r"\bbilirubin\b", r"\bthyroid stimulating hormone\b",
    r"\btsh\b", r"\bft3\b", r"\bft4\b", r"\becg\b", r"\bekg\b",
    r"\bechocardiogram\b", r"\bultrasound\b", r"\bx-ray\b", r"\bxray\b",
    r"\bct scan\b", r"\bmri\b", r"\bpet scan\b", r"\bcolonoscopy\b",
    r"\bendoscopy\b", r"\bbiopsy\b", r"\bsputum culture\b",
    r"\burinalysis\b", r"\burine culture\b", r"\bblood culture\b",
    r"\blft\b", r"\bkft\b", r"\brft\b", r"\bpft\b",
    r"\bechocardiography\b", r"\bholter\b", r"\bstress test\b",
    r"\bbone density\b", r"\bdexa\b", r"\bpsa\b", r"\bca-125\b",
    r"\bprocalcitonin\b", r"\bcrp\b", r"\besr\b", r"\bferritin\b",
    r"\bvitamin d\b", r"\bvitamin b12\b", r"\bfolate\b", r"\bcoagulation\b",
    r"\binr\b", r"\bpt\b", r"\baptt\b", r"\bserum electrolytes\b",
    r"\bsodium\b", r"\bpotassium\b", r"\bchloride\b", r"\bbicarbonate\b",
]

# ──────────────────────────────────────────────
# Helpers
# ──────────────────────────────────────────────

def identify_advisory_blocks(text: str) -> List[str]:
    """
    Split text into 'Clinical' and 'Advisory' segments.
    Advisory segments are portions of text that are instructional (e.g., 'NB', 'If you experience...').
    """
    lines = text.split('\n')
    clinical_blocks = []
    current_block = []
    is_advisory = False

    for line in lines:
        cleaned_line = line.strip().lower()
        # Check for advisory prefix
        if any(re.search(pat, cleaned_line) for pat in ADVISORY_PREFIXES):
            is_advisory = True
            # Flush current clinical block if exists
            if current_block:
                clinical_blocks.append('\n'.join(current_block))
                current_block = []
        
        # If we see a strong clinical header, switch back to clinical
        elif re.search(r"\b(diagnosis|impression|findings|summary|prescription|results|treatment)\b", cleaned_line):
             if is_advisory and current_block:
                 # Note: in this simple heuristic, we don't save advisory text
                 current_block = []
             is_advisory = False

        if not is_advisory:
            current_block.append(line)
    
    if current_block:
        clinical_blocks.append('\n'.join(current_block))
    
    return clinical_blocks


def _regex_extract(text: str, patterns: List[str]) -> List[str]:
    """Extract unique matches from text given a list of regex patterns."""
    found = set()
    for pat in patterns:
        matches = re.findall(pat, text, re.IGNORECASE)
        for m in matches:
            val = m.strip()
            # Strict filtering: lower() for comparison
            if val.lower() not in ENTITY_BLACKLIST and len(val) > 2:
                found.add(val)
    return sorted(found)


def _spacy_extract(text: str):
    """Use scispacy to pull DISEASE and CHEMICAL entities."""
    symptoms, conditions, medications, tests = [], [], [], []
    if nlp_ner is None:
        return symptoms, conditions, medications, tests
    
    # scispacy en_ner_bc5cdr_md labels: DISEASE, CHEMICAL
    doc = nlp_ner(text[:50000])  # cap at 50k chars for performance
    for ent in doc.ents:
        label = ent.label_
        e_text = ent.text.strip()
        if e_text.lower() in ENTITY_BLACKLIST:
            continue

        if label == "DISEASE":
            conditions.append(e_text)
        elif label == "CHEMICAL":
            medications.append(e_text)
    
    return symptoms, conditions, list(set(medications)), list(set(conditions))


def extract_all(text: str):
    # --- Step 1: Segmentation ---
    clinical_segments = identify_advisory_blocks(text)
    processed_text = '\n'.join(clinical_segments)

    # If segmentation left nothing, usually it means it was all advisory or no clinical content
    # We'll use the processed text even if it's small, avoiding the full fallback which includes advisoriness
    if not processed_text.strip() and len(text.strip()) > 0:
        # If the input was not empty but segments are, EVERYTHING matches advisory prefixes
        # This is rare, but we should return empty result rather than raw fallback
        return {"symptoms": [], "conditions": [], "medications": [], "tests": []}

    # --- Step 2: Extraction ---
    symptoms = _regex_extract(processed_text, SYMPTOM_KEYWORDS)
    medications = _regex_extract(processed_text, MEDICATION_KEYWORDS)
    conditions = _regex_extract(processed_text, CONDITION_KEYWORDS)
    tests = _regex_extract(processed_text, TEST_KEYWORDS)

    # --- Step 3: scispacy NER (if available, merge results) ---
    if nlp_ner is not None:
        try:
            _, sci_conditions, sci_medications, _ = _spacy_extract(processed_text)
            # Merge and deduplicate (case-insensitive)
            medications = sorted(list(set(medications + sci_medications)))
            conditions = sorted(list(set(conditions + sci_conditions)))
        except Exception as e:
            print(f"⚠️ scispacy extraction error: {e}")

    # --- Step 4: Final Blacklist Scrub (Mandatory) ---
    def scrub(items):
        return sorted(list(set([
            it for it in items 
            if it.lower() not in ENTITY_BLACKLIST and len(it.strip()) > 2
        ])))

    return {
        "symptoms": scrub(symptoms),
        "conditions": scrub(conditions),
        "medications": scrub(medications),
        "tests": scrub(tests),
    }

# ──────────────────────────────────────────────
# Document classification heuristics
# ──────────────────────────────────────────────
DOC_TYPE_RULES = {
    "lab_report": [
        r"\bcbc\b", r"\blipid panel\b", r"\bhba1c\b", r"\blft\b", r"\bkft\b",
        r"\bblood report\b", r"\blab report\b", r"\btest report\b",
        r"\bserum\b", r"\bcomplete blood\b", r"\bblood glucose\b",
    ],
    "imaging_report": [
        r"\bx-ray\b", r"\bxray\b", r"\bct scan\b", r"\bmri\b",
        r"\bultrasound\b", r"\bradiology\b", r"\bimaging\b", r"\bpet scan\b",
        r"\bsonography\b", r"\bechocardiogram\b",
    ],
    "prescription": [
        r"\bprescription\b", r"\brx\b", r"\bsig:\b", r"\brefill\b",
        r"\btablets?\b", r"\bcapsules?\b", r"\bdispense\b", r"\bdosage\b",
        r"\bonce daily\b", r"\btwice daily\b", r"\btid\b", r"\bbid\b",
        r"\bqd\b", r"\bprnb?\b", r"\bq\d+h\b",
    ],
    "discharge_summary": [
        r"\bdischarge summary\b", r"\badmission date\b", r"\bdischarge date\b",
        r"\bhospital course\b", r"\bdischarge diagnosis\b",
        r"\bdischarge medications\b", r"\bfollow.up\b",
    ],
    "consultation": [
        r"\bconsultation\b", r"\breferral\b", r"\bclinical note\b",
        r"\bhistory of present illness\b", r"\bhpi\b",
        r"\bchief complaints?\b", r"\breview of systems\b",
        r"\bphysical examination\b", r"\bplan:\b", r"\bassessment:\b",
    ],
}

CONSULTATION_TYPE_RULES = {
    "emergency": [r"\bemergency\b", r"\burgent care\b", r"\ber visit\b", r"\bacute\b"],
    "follow_up": [r"\bfollow.?up\b", r"\bfollow up\b", r"\breviewed\b", r"\bprogress note\b"],
    "routine": [r"\broutine\b", r"\bcheck.?up\b", r"\bannual\b", r"\bscreening\b"],
    "specialist": [
        r"\bspecialist\b", r"\bcardiology\b", r"\bneurology\b", r"\boncology\b",
        r"\bgastroenterology\b", r"\bendocrinology\b", r"\borthopedic\b",
        r"\burology\b", r"\bandrology\b", r"\burologist\b"
    ],
}


def classify_document(text: str):
    lower_text = text.lower()

    # Score each doc type
    doc_scores = {}
    for doc_type, patterns in DOC_TYPE_RULES.items():
        score = sum(1 for p in patterns if re.search(p, lower_text, re.IGNORECASE))
        doc_scores[doc_type] = score

    best_doc_type = max(doc_scores, key=doc_scores.get)
    best_score = doc_scores[best_doc_type]
    if best_score == 0:
        best_doc_type = "unknown"
    total_possible = max(len(DOC_TYPE_RULES.get(best_doc_type, [1])), 1)
    confidence = round(min(best_score / total_possible, 1.0), 2) if best_score > 0 else 0.0

    # Score consultation type
    consult_scores = {}
    for c_type, patterns in CONSULTATION_TYPE_RULES.items():
        consult_scores[c_type] = sum(1 for p in patterns if re.search(p, lower_text, re.IGNORECASE))
    best_consult = max(consult_scores, key=consult_scores.get)
    if consult_scores[best_consult] == 0:
        best_consult = "routine"

    return {
        "doc_type": best_doc_type,
        "consultation_type": best_consult,
        "confidence": confidence,
    }

# ──────────────────────────────────────────────
# Pydantic Models
# ──────────────────────────────────────────────
class TextRequest(BaseModel):
    text: str

class FileRequest(BaseModel):
    file_path: str

class ExtractionResponse(BaseModel):
    symptoms: List[str]
    conditions: List[str]
    medications: List[str]
    tests: List[str]

class ClassificationResponse(BaseModel):
    doc_type: str
    consultation_type: str
    confidence: float


# ──────────────────────────────────────────────
# Routes
# ──────────────────────────────────────────────
@app.get("/health")
async def health():
    return {
        "status": "ok",
        "model": MODEL_NAME,
        "bert_loaded": tokenizer is not None,
        "spacy_loaded": nlp_ner is not None,
        "ocr_available": reader is not None and HAS_OCR
    }

@app.post("/extract", response_model=ExtractionResponse)
async def extract_entities(req: TextRequest):
    """
    Extract clinical entities (symptoms, conditions, medications, tests)
    from free-form medical text.
    """
    if not req.text or not req.text.strip():
        return {"symptoms": [], "conditions": [], "medications": [], "tests": []}
    
    result = extract_all(req.text)
    return result

@app.post("/extract_ocr", response_model=ExtractionResponse)
async def extract_entities_ocr(req: FileRequest):
    """
    Extract clinical entities from a scanned PDF or image file using OCR.
    """
    if not reader or not HAS_OCR:
        print("OCR requested but EasyOCR is not available.")
        # Fallback to empty if OCR is not available
        return {"symptoms": [], "conditions": [], "medications": [], "tests": []}

    file_path = req.file_path
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail=f"File not found: {file_path}")

    extracted_text = ""
    file_ext = os.path.splitext(file_path)[1].lower()

    try:
        if file_ext == '.pdf':
            print(f"Performing OCR on PDF: {file_path}")
            doc = fitz.open(file_path)
            for i, page in enumerate(doc):
                print(f"   - Processing page {i+1}/{len(doc)}")
                pix = page.get_pixmap(matrix=fitz.Matrix(2, 2))  # upscale 2x for better OCR
                img_data = pix.tobytes("png")
                img = Image.open(io.BytesIO(img_data))
                
                # EasyOCR takes image path, image URL, image numpy array, or image bytes
                results = reader.readtext(np.array(img))
                page_text = " ".join([res[1] for res in results])
                extracted_text += page_text + "\n"
            doc.close()
        else:
            # Assume image file
            print(f"Performing OCR on image: {file_path}")
            results = reader.readtext(file_path)
            extracted_text = " ".join([res[1] for res in results])
        
        print(f"OCR complete. Extracted {len(extracted_text)} characters.")
    except Exception as e:
        print(f"OCR failed: {e}")
        raise HTTPException(status_code=500, detail=f"OCR processing failed: {str(e)}")

    if not extracted_text.strip():
        return {"symptoms": [], "conditions": [], "medications": [], "tests": []}

    return extract_all(extracted_text)

@app.post("/classify", response_model=ClassificationResponse)
async def classify_text(req: TextRequest):
    """
    Classify the document type and consultation type from medical text.
    """
    if not req.text or not req.text.strip():
        return {"doc_type": "unknown", "consultation_type": "routine", "confidence": 0.0}
    
    return classify_document(req.text)

@app.post("/encode")
async def encode_text(req: TextRequest):
    """
    Generate ClinicalBERT embeddings for clinical similarity search / risk scoring.
    """
    if tokenizer is None or model is None:
        raise HTTPException(status_code=503, detail="ClinicalBERT model not loaded")
    
    inputs = tokenizer(req.text, return_tensors="pt", truncation=True, padding=True, max_length=512)
    with torch.no_grad():
        outputs = model(**inputs, output_hidden_states=True)
        embeddings = outputs.hidden_states[-1].mean(dim=1).squeeze().tolist()
    
    return {"embeddings": embeddings}


class SimilarityRequest(BaseModel):
    target_embedding: List[float]
    candidate_embeddings: List[List[float]]
    top_k: int = 5

@app.post("/similarity")
async def calculate_similarity(req: SimilarityRequest):
    """
    Cosine similarity between target embedding and a list of candidate embeddings.
    """
    target = torch.tensor(req.target_embedding)
    candidates = torch.tensor(req.candidate_embeddings)
    cos = torch.nn.CosineSimilarity(dim=1, eps=1e-6)
    similarities = cos(target.unsqueeze(0), candidates)
    values, indices = torch.topk(similarities, min(req.top_k, len(candidates)))
    return {"indices": indices.tolist(), "scores": values.tolist()}


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8001)
