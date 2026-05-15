# VitalPath — Comprehensive Healthcare Decision-Support Platform

> **A modern, production-grade patient intake and clinical decision-support system** designed to streamline patient-clinician workflows through intelligent triage, evidence-based recommendations, and real-time data analysis.

**Status**: Active Development | **Version**: 1.0.0 | **License**: Proprietary  
**Last Updated**: May 2026

---

## 📋 Table of Contents

1. [Executive Overview](#executive-overview)
2. [Key Features](#key-features)
3. [Technology Stack](#technology-stack)
4. [System Architecture](#system-architecture)
5. [Medical Triage NLP + ML Pipelines](#-medical-triage-nlp--ml-pipelines)
6. [Installation & Setup](#installation--setup)
7. [API Documentation](#api-documentation)
8. [Database Schema](#database-schema)
9. [Core Services](#core-services)
10. [User Roles & Workflows](#user-roles--workflows)
11. [Security & Compliance](#security--compliance)
12. [Deployment](#deployment)
13. [Troubleshooting](#troubleshooting)
14. [Contributing](#contributing)
15. [Disclaimer](#disclaimer)

---

## Executive Overview

**VitalPath** is a healthcare decision-support platform that bridges the gap between patients and clinicians. It combines:

- **Intelligent Triage**: Rule-based engine + ML-powered risk scoring
- **Doctor Decision Support**: Clinical summaries, patient similarity matching, suggestion overrides
- **Patient Self-Service**: Symptom intake, medical report uploads, real-time triage feedback
- **Audit Trail**: Complete logging of all clinical decisions and overrides
- **Premium UX**: Glassmorphic design, real-time animations, mobile-responsive

### Use Cases

- **Emergency Departments**: Fast, standardized triage to prioritize critical patients
- **Urgent Care**: Symptom-based routing and initial assessment automation
- **Telehealth**: Remote patient intake with clinical confidence scoring
- **GP Practices**: Patient pre-assessment before doctor consultation
- **Hospital Systems**: Centralized patient queue management across departments

### 🌟 Core Features
- **AI-Powered Symptom Triage Chatbot**: Utilizes multi-turn conversational logic to simulate a clinical interview. It dynamically adapts its questioning based on patient responses, ensuring no critical symptom is missed. Powered by fine-tuned LLMs for medical context and reasoning.
- **Patient Symptom & History Collection**: Implements a structured intake system that captures onset, duration, frequency, and severity (1-10) for every symptom, while correlating data with a persistent longitudinal medical history stored in the EHR.
- **NLP-Based Medical Query Understanding**: Deep clinical entity extraction using ClinicalBERT. It recognizes complex medical terminology, medications, and clinical findings from unstructured patient descriptions, converting them into structured data for the triage engine.
- **Risk Scoring & Prioritization**: A sophisticated hybrid engine that weighs deterministic "Red Flag" rules against ML-predicted risk probabilities. Patients are automatically sorted in the doctor's queue based on their calculated clinical urgency and risk score.
- **Emergency Alert Detection**: Real-time monitoring of life-threatening indicators (e.g., chest pain + low SpO2). Triggers an immediate full-screen emergency overlay for the patient with actionable instructions and simultaneous high-priority alerts to clinical staff.
- **Care Recommendation Engine**: An evidence-based decision engine that maps complex triage outputs to simple, actionable care pathways. It provides the "Why" behind every recommendation, increasing patient trust and clinical transparency.
- **Multi-turn Conversational Interface**: The AI agent follows up with relevant clinical questions to rule out exclusions or confirm high-risk indicators, mimicking the natural flow and rigor of a professional medical consultation.
- **Health Guidance Dashboard**: A centralized command center for patients to view their medical journey. It visualizes health stability trends, upcoming consultations, and personalized guidance based on their specific symptom profile.


### 🏥 Care Recommendation Levels
- **🏠 Home Care**: Suitable for minor, self-limiting symptoms (e.g., mild cold, stable vitals). Provides the patient with automated self-care guidance, lifestyle adjustments, and specific "worsening symptoms" to monitor for.
- **🏥 Clinic Visit**: Recommended for moderate symptoms requiring professional diagnostic evaluation (e.g., persistent abdominal pain, high fever). Facilitates scheduling and provides a clinical summary for the upcoming consultation.
- **🚨 Emergency Room**: Reserved for high-risk, acute, or life-threatening symptoms (e.g., chest pain, respiratory distress, severe trauma). Triggers immediate emergency protocols, including location-based hospital routing and staff alerts.


---

## 🚀 Key Features

### 1. **Smart Triage Engine** ⚙️

**Rule-Based Assessment System**
- Evaluates vital signs against evidence-based thresholds
- Classifies symptoms by severity: Critical → High → Moderate → Stable
- Generates immediate priority recommendations with confidence scoring
- Outputs transparent reasoning (what factors triggered which priority level)

**Vital Sign Thresholds Monitored**:
| Vital Sign | Critical | High | Moderate | Unit |
|---|---|---|---|---|
| **Oxygen Saturation (SpO₂)** | < 90% | 90–93% | 94–95% | % |
| **Heart Rate** | < 40 or > 150 | 40–50 or 120–150 | 50–60 or 100–120 | bpm |
| **Blood Pressure (Systolic)** | < 80 or ≥ 180 | 80–89 or 160–179 | 140–159 | mmHg |
| **Temperature** | < 35 or ≥ 40°C | 39–39.9°C | 38–38.9°C | °C |
| **Respiratory Rate** | < 8 or > 30 | 25–30 | 8–11 | breaths/min |
| **Blood Glucose** | < 50 or > 400 | 50–69 or 250–400 | — | mg/dL |

**Symptom Classification**:
- **Critical Symptoms**: Chest pain, difficulty breathing, seizure, paralysis, severe bleeding, loss of consciousness
- **High Symptoms**: Severe abdominal/headache pain, sudden vision loss, high fever, persistent vomiting, confusion
- **Moderate Symptoms**: Nausea, vomiting, cough, sore throat, rash, moderate pain

**Output**: `{ priority: 'stable'|'moderate'|'high'|'critical', score: 0-100, reasoning: [], triggeredRules: [] }`

#### **Care Recommendation Levels**
The system classifies patients into actionable care categories based on triage results:
- **🏠 Home Care**: Minor symptoms; provide basic guidance, lifestyle tips, and monitoring recommendations.
- **🏥 Clinic Visit**: Moderate symptoms requiring a scheduled consultation with a healthcare professional.
- **🚨 Emergency Room**: High-risk or emergency symptoms requiring immediate medical attention.

---

### 2. **ML-Powered Risk Scoring** 🤖

**Hybrid Approach**: Rule Engine + Machine Learning

- **Rule Engine**: Hard thresholds, deterministic, fully explainable
- **ML Model**: Probability-based scoring from normalized features
- **Merge Strategy**: Takes maximum priority from both systems

**ML Features Extracted**:
- Normalized vital signs
- Symptom count, average/max severity
- Key symptom presence (chest pain, breathing difficulty, LOC)
- Historical context

**Graceful Degradation**: If ML service offline → system continues with rule engine only

---

### 3. **Clinical Entity Extraction (ClinicalBERT)** 🧬

**Microservice**: Python FastAPI + Transformers

**Capabilities**:
- **Named Entity Recognition (NER)**: Extract symptoms, medications, diseases, procedures
- **Live Insights**: Real-time text analysis as patients type
- **OCR Support**: Scanned PDF parsing with EasyOCR
- **Medical Report Parsing**: Extract structured data from clinical notes/PDFs

**Integration Points**:
- Patient symptom form → real-time suggestions
- Medical report upload → automatic entity extraction
- Doctor dashboard → similar case identification

---

### 4. **Doctor Decision Support** 👨‍⚕️

**AI-Generated Clinical Summaries**
- Powered by Google Generative AI (Gemini) or OpenAI GPT-4
- Summarizes recent symptoms, vitals, reports, and triage history
- Highlights key clinical findings in plain language
- **Fully reviewable and overridable** — doctors retain authority

**Patient Queue Management**
- Real-time queue sorted by triage priority
- Alerts for critical/high-priority patients
- Quick-access patient card with key metrics

**Triage Override Capability**
- Doctors can override AI triage with manual decision
- Requires mandatory reason + clinical notes
- Logged for audit trail and model improvement

**Patient Similarity Matching**
- Find clinically similar cases in database
- Supports clinical research and pattern identification
- Powered by clinical embeddings + cosine similarity

---

### 5. **Patient Portal** 👤

**Self-Service Intake**
- Multi-step symptom form with vital sign entry
- Common symptom suggestions for quick selection
- Severity/duration/frequency tracking for each symptom
- Real-time clinical insights from text analysis

**Medical Report Management**
- Upload scans (PDF, JPG, PNG)
- Automatic OCR parsing for scanned documents
- Structured data extraction (medications, procedures, diagnoses)
- Report history with filtering by type (lab, imaging, discharge, etc.)

**Dashboard & Tracking**
- Personal triage history timeline
- Symptom logs with temporal trends
- Doctor assignments and follow-up reminders
- Health insights and lifestyle suggestions

---

### 6. **Admin & Audit** 📋

**User Management**
- Create/edit/delete users (patients, doctors, admins)
- Role-based access control (RBAC): Patient | Doctor | Admin
- User activity logging

**Audit Trail**
- Every clinical decision logged with timestamp, user, reason
- Triage overrides recorded with doctor justification
- Report access logs for compliance (HIPAA-ready)
- Data export for regulatory reporting

**System Monitoring**
- Model performance tracking
- ML service health status
- Error logs and alerts
- Database usage metrics

---

### 7. **Reminders & Notifications** 🔔

**Patient Reminders**
- Follow-up appointment reminders
- Medication adherence reminders
- Lifestyle activity reminders
- Customizable frequency and timing

**Doctor Alerts**
- Critical/high-priority patient notifications
- Patient action-required alerts
- System health alerts

---

### 8. **Electronic Health Records (EHR) System** 🏥

**Persistent Medical Profiles**
- Comprehensive tracking of patient demographics, allergies, chronic conditions, and past surgeries.
- Unified access point for doctors to view all historical triage sessions, AI summaries, and clinical notes.

**Health Stability & Risk Tracking**
- Real-time **Health Stability Trend** charting.
- Longitudinal tracking of both mental and physical risk scores.

**Intelligent Search & Summarization**
- AI-generated health summaries summarizing the patient's entire medical history for quick clinical review.
- Advanced keyword filtering and temporal sorting to locate past incidents and reports.

---

### 9. **Predictive Outbreak Analysis** 🗺️

**Open-Source Geospatial Stack**
- Fully integrated zero-cost, API-key-free mapping stack utilizing **Leaflet** and **OpenStreetMap**.
- Dark-themed, medical-grade CartoDB basemap ensuring maximum contrast and legibility for analytics.

**Dynamic Disease Heatmaps**
- Automated plotting of active disease clusters (e.g., Dengue, Typhoid, Chikungunya).
- Visual heat intensity scaled relative to the severity and density of outbreaks.

**Location-Specific Analytics**
- Real-time calculation of zone-specific metrics (`In Today`, `Out Today`, `Total Resolved`).
- Interactive dashboard components that dynamically filter when a clinician clicks an outbreak marker.
- Glassmorphic popup cards providing instant localized intelligence without requiring page reloads.

---

### 10. **Premium Design & UX** 🎨

**Visual Theme**: Glassmorphic, charcoal/slate aesthetic
- Frosted glass effects with subtle gradients
- Smooth animations powered by Framer Motion
- High-contrast accessibility-compliant typography
- Mobile-responsive layouts

**Interactive Elements**:
- Risk badges (color-coded by priority)
- Real-time form validation
- Drag-drop file uploads with preview
- Smooth transitions between triage result states

---

### 11. **Advanced Features** 🚀
- **🎙️ Voice-Enabled Healthcare Assistant**: Integrates Speech-to-Text and Text-to-Speech technologies to allow hands-free interaction. Optimized for accessibility, allowing patients with limited mobility or vision to complete triage via natural voice commands.
- **🌐 Multilingual Healthcare Support**: Robust internationalization framework providing real-time translation of the interface and AI responses. Currently supports multiple languages to bridge communication gaps in diverse healthcare settings.
- **⌚ Wearable Device Integration**: Direct synchronization with smartwatches and health sensors. Automatically pulls real-time Heart Rate, SpO2, and activity data to provide a continuous stream of objective vitals for more accurate risk assessment.
- **📈 Real-time Vital Sign Monitoring**: Visualizes vital sign trends over time, highlighting anomalies and significant deviations. Predictive analytics identify potential health dips before they become critical, enabling proactive intervention.
- **📄 AI-Generated Health Reports**: One-click generation of professional clinical summaries. These reports aggregate symptoms, vitals, and AI findings into a downloadable PDF format, ready for the patient to share with their primary care provider.
- **📹 Video Consultation Integration**: Seamlessly bridges the gap between digital triage and human care. When a "Clinic Visit" is recommended, patients can launch a secure, WebRTC-powered video call directly within the platform.
- **🏥 Electronic Health Record (EHR) Support**: A comprehensive digital record system that persists patient data across sessions. Stores allergies, chronic conditions, and past surgical history, providing doctors with a 360-degree view of patient health.
- **🧠 Mental Health Assessment Module**: Integrated screening tools for psychological wellbeing. Assesses anxiety, depression, and stress levels through validated clinical scales, correlating mental health data with physical risk scores for holistic care.
- **🗺️ Predictive Outbreak Analysis**: A geospatial intelligence tool that monitors local disease clusters. Uses anonymized triage data to generate Leaflet-based heatmaps, alerting public health officials to emerging outbreaks in real-time.
- **🔔 AI-Based Medication Reminders**: Intelligent scheduling engine that tracks medication adherence. Sends smart notifications to patients and allows clinicians to monitor compliance, reducing the risk of treatment failure due to missed doses.



---

## 🛠 Technology Stack

### **Frontend** (React 19 + Vite)

| Layer | Technology | Purpose |
|---|---|---|
| **Framework** | React 19 | Modern UI with hooks, suspense |
| **Build Tool** | Vite 7.3 | Ultra-fast HMR, optimized bundles |
| **Router** | React Router 7 | Client-side navigation |
| **Styling** | Vanilla CSS (custom) | Precise design control, no framework overhead |
| **Animations** | Framer Motion 12 | Smooth, performant transitions |
| **Icons** | Lucide React | Modern, lightweight SVG icons |
| **HTTP Client** | Axios 1.13 | Promise-based API calls, interceptors |
| **File Upload** | React Dropzone | Drag-drop file handling |
| **State Management** | React Context API | Auth context, user state |
| **Linting** | ESLint 9 | Code quality, React hooks validation |

**Build Output**: ~150 KB gzipped (optimized for speed)

### **Backend** (Node.js + Express)

| Layer | Technology | Purpose |
|---|---|---|
| **Runtime** | Node.js 18+ | JavaScript server runtime |
| **Framework** | Express 4.18 | Minimal HTTP server |
| **Database** | MongoDB 6+ | Document-oriented, BSON storage |
| **ODM** | Mongoose 8 | Schema validation, middleware hooks |
| **Auth** | JWT (jsonwebtoken 9) | Stateless token-based auth |
| **Password Hash** | bcryptjs 2.4 | Secure password hashing (Bcrypt) |
| **Rate Limiting** | express-rate-limit 7 | DDoS/brute-force protection |
| **Security Headers** | Helmet 7 | CORS, CSP, X-Frame-Options |
| **CORS** | cors 2.8 | Cross-origin request handling |
| **File Upload** | Multer 1.4 | Multipart file parsing |
| **PDF Parsing** | pdf-parse 1.1 | Extract text from PDFs |
| **HTTP Client** | Axios 1.13 | Call ML/LLM services |
| **Environment** | dotenv 16 | Config from .env file |
| **Logging** | Morgan 1.10 | HTTP request logging |
| **Error Handling** | express-async-errors 3.1 | Catch unhandled promise rejections |
| **Testing** | Jest 29, Supertest 7 | Unit + integration tests |
| **Process Manager** | Nodemon 3 (dev), PM2 (prod) | Auto-restart on file changes |

### **ML Microservice** (Python + FastAPI)

| Component | Technology | Purpose |
|---|---|---|
| **Web Framework** | FastAPI 0.136 | Async REST API with auto-docs |
| **Server** | Uvicorn 0.37 | ASGI server for FastAPI |
| **ML Models** | Transformers 5.8, Torch 2.12 | ClinicalBERT, embeddings, inference |
| **NLP** | spaCy 3.8 | Medical entity recognition |
| **OCR** | EasyOCR 1.7 | Scanned PDF text extraction |
| **PDF Processing** | pdf2image 1.17, OpenCV | Convert PDFs to images |
| **Image Processing** | Pillow 12 | Image resizing, preprocessing |

**Model Details**:
- **ClinicalBERT**: Specialized BERT for clinical text, trained on MIMIC database
- **Embeddings**: Generate clinical document embeddings for similarity matching
- **OCR**: Multi-language support, handles scanned/rotated documents

### **External Services**

| Service | Purpose | API |
|---|---|---|
| **Groq Cloud** (Llama 3.3) | Ultra-fast inference for health reports and summaries | REST API |
| **Google Generative AI** (Gemini) | LLM for clinical insights and complex reasoning | REST API |
| **OpenAI GPT-4** (alternative) | LLM fallback, report parsing | REST API |
| **MongoDB Atlas** (optional) | Cloud database hosting | Connection string |

---

## 📐 System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER INTERFACES                           │
├─────────────────────────────────────────────────────────────────┤
│  Patient Portal (React)  │  Doctor Dashboard (React)  │ Admin UI │
│  Symptom Form           │  Patient Queue            │ User Mgmt │
│  Report Upload          │  Triage Override          │ Analytics │
└────────────┬─────────────────────────────────────────┬──────────┘
             │                                         │
    ┌────────▼───────────────────────────────────────▼────────┐
    │         API Gateway / Express Backend (Port 5000)        │
    ├──────────────────────────────────────────────────────────┤
    │  • /api/auth           (login, register, refresh token) │
    │  • /api/patients       (profile, symptoms, triage)      │
    │  • /api/doctors        (queue, patient detail, summary) │
    │  • /api/reports        (upload, parse, history)         │
    │  • /api/triage         (latest, history, override)      │
    │  • /api/reminders      (crud operations)                │
    │  • /api/admin          (users, audit logs)              │
    │  • /api/chat           (AI chatbot)                     │
    └────────┬────────────────────────┬──────────────┬────────┘
             │                        │              │
    ┌────────▼────────────┐  ┌────────▼──────────┐  └─────┐
    │   MongoDB Database  │  │  ClinicalBERT    │        │
    │   (Port 27017)      │  │  Microservice    │   External
    ├─────────────────────┤  │  (Port 8000)     │   LLM APIs
    │ Collections:        │  ├──────────────────┤   (Gemini/
    │ • Users             │  │ • FastAPI        │    GPT-4)
    │ • Patients          │  │ • Transformers   │
    │ • Doctors           │  │ • spaCy NER      │
    │ • TriageResults     │  │ • EasyOCR        │
    │ • Symptoms          │  │ • pdf2image      │
    │ • MedicalReports    │  └──────────────────┘
    │ • AuditLogs         │
    │ • Reminders         │
    └─────────────────────┘
```

### **Data Flow: Patient Intake & Triage**

```
Patient Submits Symptoms
        │
        ▼
ClinicalBERT: Extract entities (NER)
        │
        ▼
Rule Engine: Check vital thresholds
        ├─→ Critical symptoms detected?
        ├─→ Vital signs abnormal?
        └─→ Generate priority score
        │
        ▼
ML Model: Predict risk probability
        │
        ▼
Merge Results (max of rule + ML)
        │
        ▼
Save TriageResult to MongoDB
        │
        ▼
Notify Doctors (Alert if critical/high)
        │
        ▼
Display to Patient (Results + Reasoning)
        │
        ▼
Doctor Reviews & Can Override
        │
        ▼
Audit Log Entry Created
```

---

## 🧠 Medical Triage NLP + ML Pipelines

This module connects raw chatbot text to trained ML triage models.

### Architecture

```text
User message
  -> nlp_pipeline.py
  -> extracted symptoms
  -> ml_pipeline.py
  -> triage, risk score, emergency output
  -> chatbot / LLM response layer
```

### Required Files

The ML pipeline requires these files from the `scratch/triage-assistant-main/models/` directory:

- `triage_classifier.pkl` — scikit-learn classifier for triage categorization
- `risk_score_regressor.pkl` — scikit-learn regressor for risk scoring
- `emergency_detector.pkl` — scikit-learn classifier for emergency detection
- `symptoms_list.json` — canonical symptom dictionary
- `severity_dict.json` — symptom severity mappings
- `feature_names.json` — feature column ordering (critical for consistency)

### Libraries Used

- Python 3.11
- NumPy: builds numeric feature vectors
- scikit-learn: model inference, TF-IDF, cosine similarity
- joblib: loads trained `.pkl` model files
- json: loads metadata files
- pathlib: handles model paths
- re: text preprocessing and symptom matching

**Install**:

```powershell
pip install numpy==1.26.4 scikit-learn==1.6.1 joblib
```

⚠️ **Important**: Use `scikit-learn==1.6.1` because the pickle models were trained with that version. Mismatched versions cause deserialization errors.

### NLP Pipeline

**File**: `nlp_pipeline.py`

**Function**:

```python
run_nlp_pipeline(text: str) -> list[str]
```

**Responsibilities**:

- Lowercase preprocessing
- Punctuation cleanup
- Symptom matching using `symptoms_list.json`
- Synonym mapping
- Negation handling
- TF-IDF fallback when exact matching fails

**Example**:

```python
from nlp_pipeline import run_nlp_pipeline

symptoms = run_nlp_pipeline("I have breathing difficulty and heart racing")
print(symptoms)
```

**Output**:

```python
["breathlessness", "fast heart rate"]
```

**Negation Example**:

```python
run_nlp_pipeline("I have fever but no chest pain")
```

**Output**:

```python
["high fever"]
```

### ML Pipeline

**File**: `ml_pipeline.py`

**Function**:

```python
run_ml_pipeline(symptoms: list[str]) -> dict
```

**Loaded Models**:

The ML pipeline loads:

- `triage_classifier.pkl` — Predicts triage category
- `risk_score_regressor.pkl` — Predicts numeric risk score
- `emergency_detector.pkl` — Predicts binary emergency flag
- `symptoms_list.json` — Symptom canonical forms
- `severity_dict.json` — Severity scores per symptom
- `feature_names.json` — Feature column ordering

It converts symptoms into the same feature order used during training. It also computes:

- `total_severity_score` — Sum of all symptom severities
- `symptom_count` — Number of symptoms
- `max_symptom_severity` — Highest severity
- `avg_symptom_severity` — Average severity
- `high_risk_flag` — Binary indicator (1 if risk score > threshold)

**Output**:

```python
{
  "triage": "urgent",
  "risk_score": 0.78,
  "emergency": False
}
```

### Full Usage Example

**Run from the `backend` folder**:

```powershell
python -c "from nlp_pipeline import run_nlp_pipeline; from ml_pipeline import run_ml_pipeline; text='I have chest pain and dizziness'; symptoms=run_nlp_pipeline(text); prediction=run_ml_pipeline(symptoms); print('Symptoms:', symptoms); print('Prediction:', prediction)"
```

### Chatbot Integration

```python
from nlp_pipeline import run_nlp_pipeline
from ml_pipeline import run_ml_pipeline

def handle_user_message(user_message: str):
    symptoms = run_nlp_pipeline(user_message)
    prediction = run_ml_pipeline(symptoms)
    return {
        "symptoms": symptoms,
        "prediction": prediction,
    }
```

The chatbot or LLM layer can use:

- `prediction["triage"]` — Recommended triage category
- `prediction["risk_score"]` — Numeric risk (0–1)
- `prediction["emergency"]` — Boolean emergency flag

---

## 📦 Installation & Setup

### Prerequisites

| Tool | Version | Purpose |
|---|---|---|
| **Node.js** | v18+ | Backend & Frontend |
| **npm** | v9+ | Package manager |
| **MongoDB** | v6+ | Database (local or Atlas) |
| **Python** | v3.9+ | ML microservice |
| **Poppler** | latest | PDF → image conversion *(optional)* |
| **Git** | latest | Version control |

### Step-by-Step Installation

#### 1. Clone Repository
```bash
git clone https://github.com/Ansukr07/VitalPath.git
cd VitalPath
<!-- Deployment Trigger -->
```

#### 2. Backend Setup

```bash
cd backend
npm install
```

**Create `.env` file** (copy from `.env.example`):
```env
# Server
PORT=5000
NODE_ENV=development

# Database
MONGO_URI=mongodb://localhost:27017/medic_db
# OR for MongoDB Atlas:
# MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/medic_db

# Authentication
JWT_SECRET=your-super-secret-key-here-minimum-32-chars
JWT_REFRESH_SECRET=your-refresh-secret-minimum-32-chars
JWT_EXPIRES_IN=1d
JWT_REFRESH_EXPIRES_IN=7d

# ML Service
ML_SERVICE_URL=http://localhost:8000/predict

# LLM (choose one)
# Option 1: Google Gemini
LLM_API_KEY=your-google-generative-ai-key
LLM_MODEL=gemini-2.0-flash

# Option 2: OpenAI GPT-4
# LLM_API_KEY=your-openai-api-key
# LLM_MODEL=gpt-4o-mini

# File Upload
UPLOAD_DIR=uploads
MAX_FILE_SIZE=50000000  # 50 MB

# CORS
FRONTEND_URL=http://localhost:5173

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000     # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100     # requests per window
```

**Seed Database** (optional):
```bash
npm run seed
```
This creates sample patients, doctors, and reports for testing.

**Start Backend**:
```bash
# Development (with auto-restart)
npm run dev

# Production
npm start
```

Backend will be available at **http://localhost:5000**

**Health Check**:
```bash
curl http://localhost:5000/api/health
```

---

#### 3. Frontend Setup

```bash
cd ../frontend
npm install
```

**Start Dev Server**:
```bash
npm run dev
```

Frontend will be available at **http://localhost:5173**

**Build for Production**:
```bash
npm run build        # Creates dist/ folder
npm run preview      # Serve built output locally
```

---

#### 4. ML Microservice (ClinicalBERT)

```bash
cd backend/scripts

# Install Python dependencies
pip install -r requirements.txt

# Start service
python clinical_bert_app.py
```

Service will be available at **http://localhost:8000**

**API Endpoints**:
- `POST /predict` — Risk scoring from patient features
- `POST /extract_entities` — NER from text
- `POST /ocr` — Extract text from PDFs
- `POST /embeddings` — Generate clinical embeddings
- `/docs` — FastAPI Swagger UI

---

#### 5. Database Setup

**Option A: Local MongoDB**
```bash
# Windows
mongod --dbpath "C:\data\db"

# macOS
brew services start mongodb-community

# Linux
sudo systemctl start mongod
```

**Option B: MongoDB Atlas (Cloud)**
1. Create account at https://www.mongodb.com/cloud/atlas
2. Create cluster
3. Get connection string: `mongodb+srv://username:password@cluster.mongodb.net/medic_db`
4. Update `MONGO_URI` in `.env`

---

### Running All Services Together

**Terminal 1 - Backend**:
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend**:
```bash
cd frontend
npm run dev
```

**Terminal 3 - ML Service**:
```bash
cd backend/scripts
python clinical_bert_app.py
```

**Verify All Services**:
```bash
# Backend
curl http://localhost:5000/api/health

# Frontend
# Open http://localhost:5173 in browser

# ML Service
curl http://localhost:8000/docs
```

---

## 📡 API Documentation

### **Authentication**

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "patient@example.com",
  "password": "SecurePassword123",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+1234567890",
  "role": "patient"  // or "doctor"
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "_id": "64f7a3b2c1e5d8f9g0h1i2j3",
      "email": "patient@example.com",
      "firstName": "John",
      "role": "patient"
    }
  }
}
```

---

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "patient@example.com",
  "password": "SecurePassword123"
}
```

---

#### Refresh Token
```http
POST /api/auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```





## 🔧 Core Services

### 1. **Triage Engine** (`backend/services/triageEngine.js`)

**Function**: `runTriageEngine(vitals, symptoms)`

```javascript
const result = runTriageEngine(
  {
    heartRate: 95,
    bloodPressureSystolic: 140,
    temperature: 37.8,
    oxygenSaturation: 96
  },
  [
    { name: 'Chest Pain', severity: 8, durationDays: 2, frequency: 'intermittent' }
  ]
);

// Output:
// {
//   priority: 'high',
//   score: 72,
//   reasoning: [...],
//   triggeredRules: [...]
// }
```

**Features**:
- Deterministic rule application
- Detailed reasoning output
- Symptom severity modifiers
- Duration-based priority escalation

---

### 2. **ML Service** (`backend/services/mlService.js`)

**Function**: `getMLRiskScore(features, clinicalEmbeddings)`

Calls external FastAPI service at `ML_SERVICE_URL` (default: http://localhost:8000/predict)

```javascript
const result = await getMLRiskScore({
  oxygen_saturation: 96,
  heart_rate: 95,
  systolic_bp: 140,
  symptom_count: 2,
  avg_symptom_severity: 7.5,
  has_chest_pain: 1
});

// Output:
// {
//   available: true,
//   priority: 'moderate',
//   probabilityMap: { stable: 0.1, moderate: 0.55, high: 0.3, critical: 0.05 },
//   confidence: 0.82,
//   modelVersion: 'v1.2.0'
// }
```

**Graceful Fallback**: If service unavailable, returns `{ available: false, ... }`

---

### 3. **Clinical BERT Service** (`backend/services/clinicalBertService.js`)

**Function**: `extractEntities(text)`

```javascript
const result = await extractEntities("I have severe chest pain and shortness of breath for 2 days");

// Output:
// {
//   symptoms: ['chest pain', 'shortness of breath'],
//   medications: [],
//   conditions: [],
//   procedures: []
// }
```

**Function**: `getClinicalEmbeddings(text)`

Generate embeddings for clinical similarity matching.

**Function**: `findSimilarCases(patientId, limit, threshold)`

Find similar patients in database using clinical embeddings + cosine similarity.

---

### 4. **LLM Service** (`backend/services/llmService.js`)

**Function**: `summarizePatientForDoctor(patientData)`

```javascript
const summary = await summarizePatientForDoctor({
  patientId: '...',
  symptoms: [...],
  vitals: {...},
  reports: [...],
  triageLevel: 'high'
});

// Output: "John Doe, 45M, presents with acute chest pain (8/10)..."
```

**Models Supported**:
- Google Generative AI (Gemini 2.0 Flash)
- OpenAI GPT-4 / GPT-4o-mini

**Safety Features**:
- No diagnosis generation (decision-support only)
- No treatment recommendations
- Doctor-focused language
- Audit logging

---

## 👥 User Roles & Workflows

### **Patient Workflow**

```
1. Register/Login
   ├─ Create account with email, password
   └─ MFA available (optional)

2. Symptom Intake
   ├─ Fill symptom form (name, severity, duration, frequency)
   ├─ Real-time clinical insights from ClinicalBERT
   └─ Confirm symptoms

3. Vital Sign Entry
   ├─ Enter vital signs (HR, BP, temp, O2, RR, glucose)
   ├─ Validation against normal ranges
   └─ Save vitals to profile

4. Review Assessment
   ├─ View triage result (priority, score, reasoning)
   ├─ Understand what triggered priority level
   └─ See doctor next steps

5. Medical Reports
   ├─ Upload scans (PDF, JPG, PNG)
   ├─ Automatic OCR parsing
   └─ View extracted data

6. Dashboard & Tracking
   ├─ View triage history timeline
   ├─ Track symptom trends
   └─ See reminders and follow-ups

7. Doctor Communication
   ├─ Receive doctor assignments
   ├─ View doctor notes/recommendations
   └─ Schedule follow-ups
```

### **Doctor Workflow**

```
1. Dashboard
   ├─ View patient queue sorted by priority
   ├─ See critical/high-priority alerts
   └─ Quick-access patient cards

2. Patient Review
   ├─ Access full patient detail
   ├─ View symptoms, vitals, triage results
   ├─ Review uploaded reports
   └─ See triage history

3. AI Assistance
   ├─ Request AI clinical summary
   ├─ View summary (fully reviewable)
   ├─ Find similar cases for reference
   └─ No auto-recommendations

4. Triage Override (if needed)
   ├─ Review AI-generated priority
   ├─ Click "Override" if clinical judgment differs
   ├─ Mandatory: Enter reason + notes
   ├─ Confirms: "I take clinical responsibility"
   └─ Logged for audit trail

5. Clinical Documentation
   ├─ Add clinical notes to patient chart
   ├─ Create follow-up reminders
   └─ Close case or refer specialist

6. Audit Trail Access
   ├─ View all decisions on patient record
   ├─ Filter by action, user, date
   └─ Export for compliance
```

### **Admin Workflow**

```
1. User Management
   ├─ Create/edit/delete users
   ├─ Assign roles (patient, doctor, admin)
   ├─ Manage user permissions
   └─ Track user activity

2. System Monitoring
   ├─ View health status (DB, ML service, LLM)
   ├─ Monitor error logs
   ├─ Check system metrics
   └─ Alert management

3. Audit & Compliance
   ├─ View comprehensive audit logs
   ├─ Filter by user, action, date range
   ├─ Export logs for compliance
   └─ Generate reports

4. Model Performance
   ├─ Track triage accuracy metrics
   ├─ Monitor ML model performance
   ├─ Version management
   └─ Model update deployment

5. Database Management
   ├─ Backup scheduling
   ├─ Data retention policies
   ├─ GDPR/deletion requests
   └─ Data export
```

---

## 🔐 Security & Compliance

### **Authentication & Authorization**

- **JWT (JSON Web Tokens)**: Stateless token-based auth
  - Access token: 1 day expiration
  - Refresh token: 7 days expiration
- **Password Hashing**: Bcrypt (salt rounds: 10)
- **Role-Based Access Control (RBAC)**: Patient | Doctor | Admin
- **Rate Limiting**: 100 requests per 15 minutes per IP

### **Data Protection**

- **Encryption in Transit**: HTTPS/TLS (required in production)
- **Encryption at Rest**: MongoDB encryption (optional)
- **Sensitive Field Masking**: Passwords, tokens never logged
- **Data Validation**: Input sanitization, schema validation (Mongoose)

### **Audit & Compliance**

- **Comprehensive Audit Logging**:
  - User login/logout
  - Data access (who viewed patient records)
  - Triage overrides (reason + notes logged)
  - Report uploads/deletions
  - All changes tracked with timestamp + user

- **HIPAA-Ready**:
  - PHI handling protocols
  - Access logs for compliance officers
  - Data export for breach notification
  - Patient consent tracking (framework)

- **GDPR Compliance**:
  - Right to be forgotten (delete patient data)
  - Data portability (export patient records)
  - Consent management
  - Third-party processor agreements

### **API Security**

- **CORS**: Restricted to whitelisted origins
- **Helmet**: Security headers (CSP, X-Frame-Options, etc.)
- **Input Validation**: All inputs validated before processing
- **SQL Injection Protection**: MongoDB (no SQL), parameterized queries
- **XSS Protection**: React automatically escapes output

### **Clinical Safety**

- **Decision Support Only**: All outputs clearly marked as non-diagnostic
- **Doctor Authority**: Doctors can override any AI recommendation
- **Transparency**: All reasoning logged and explainable
- **No Auto-Actions**: No prescriptions, treatments, or medical advice generated

---

## 🚀 Deployment


### **Environment-Specific Configuration**

**Development**:
```env
NODE_ENV=development
DEBUG=true
RATE_LIMIT_MAX_REQUESTS=1000
```

**Production**:
```env
NODE_ENV=production
DEBUG=false
RATE_LIMIT_MAX_REQUESTS=100
ML_SERVICE_URL=https://ml-service.example.com/predict
MONGO_URI=mongodb+srv://prod-user:pwd@prod-cluster.mongodb.net/medic_prod
```

---

### **Branch Strategy**

```
main (production)
  ↑
  └─ develop (staging)
       ↑
       ├─ feature/triage-engine
       ├─ feature/ml-improvements
       └─ bugfix/auth-token
```

### **Testing**

```bash
# Backend
npm test

# Frontend
npm run lint

# ML Service
pytest backend/scripts/test_clinical_bert.py
```


### Regulatory Status

- **NOT FDA-cleared** as medical device
- **For healthcare professional use only**
- **Requires clinical governance oversight**
- **Subject to institutional compliance policies**

---


Built with ❤️ for better healthcare outcomes.

**Questions? open an issue!**