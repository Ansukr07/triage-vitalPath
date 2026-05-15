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
5. [Installation & Setup](#installation--setup)
6. [API Documentation](#api-documentation)
7. [Database Schema](#database-schema)
8. [Core Services](#core-services)
9. [User Roles & Workflows](#user-roles--workflows)
10. [Security & Compliance](#security--compliance)
11. [Deployment](#deployment)
12. [Troubleshooting](#troubleshooting)
13. [Contributing](#contributing)
14. [Disclaimer](#disclaimer)

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

### 8. **Premium Design & UX** 🎨

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
| **Google Generative AI** (Gemini) | LLM for clinical summaries, insights | REST API |
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

---

### **Patient Endpoints**

#### Get Patient Profile
```http
GET /api/patients/me
Authorization: Bearer <accessToken>
```

---

#### Submit Symptoms & Get Triage
```http
POST /api/patients/symptoms
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "symptoms": [
    {
      "name": "Chest Pain",
      "severity": 8,           // 1-10 scale
      "durationDays": 2,
      "frequency": "constant"  // or intermittent
    },
    {
      "name": "Shortness of Breath",
      "severity": 7,
      "durationDays": 2,
      "frequency": "intermittent"
    }
  ],
  "currentVitals": {
    "heartRate": 95,                    // bpm
    "bloodPressureSystolic": 140,       // mmHg
    "bloodPressureDiastolic": 90,
    "temperature": 37.2,                // Celsius
    "oxygenSaturation": 96,             // %
    "respiratoryRate": 18,              // breaths/min
    "bloodGlucose": 110                 // mg/dL (optional)
  }
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "triage": {
      "finalPriority": "high",        // stable|moderate|high|critical
      "finalScore": 72,               // 0-100
      "prioritySource": "rule_engine",
      "ruleEngine": {
        "priority": "high",
        "score": 72,
        "reasoning": [
          {
            "factor": "Heart Rate",
            "value": "95 bpm",
            "threshold": "borderline heart rate",
            "contribution": "high",
            "source": "rule_engine"
          }
        ],
        "triggeredRules": ["Heart Rate: borderline heart rate"]
      },
      "mlModel": {
        "available": true,
        "priority": "moderate",
        "probabilityMap": {
          "stable": 0.1,
          "moderate": 0.55,
          "high": 0.3,
          "critical": 0.05
        },
        "confidence": 0.82
      }
    }
  }
}
```

---

#### Upload Medical Report
```http
POST /api/reports/upload
Authorization: Bearer <accessToken>
Content-Type: multipart/form-data

[Form Data]
file: <PDF/JPG/PNG file>
reportType: "lab"         // lab|imaging|discharge|prescription|other
reportDate: "2026-05-10"
```

**Response**:
```json
{
  "success": true,
  "data": {
    "_id": "64f7a3b2c1e5d8f9g0h1i2j3",
    "patient": "...",
    "reportType": "lab",
    "fileUrl": "uploads/64f7a3b2c1e5d8f9g0h1i2j3/report.pdf",
    "parsedData": {
      "summary": "Complete blood count: WBC 7.2, RBC 4.8...",
      "extractedText": "...",
      "entities": {
        "tests": ["WBC", "RBC", "Hemoglobin"],
        "medications": [],
        "conditions": []
      }
    }
  }
}
```

---

#### Get Live Clinical Insights
```http
POST /api/patients/clinical-insights
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "text": "I've had a severe headache for two days, also experiencing nausea"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "symptoms": ["severe headache", "nausea"],
    "medications": [],
    "conditions": []
  }
}
```

---

### **Doctor Endpoints**

#### Get Patient Queue
```http
GET /api/doctors/queue
Authorization: Bearer <accessToken>
```

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "patient": {...},
      "lastTriage": {
        "finalPriority": "critical",
        "finalScore": 95,
        "createdAt": "2026-05-14T10:30:00Z"
      },
      "urgency": "CRITICAL"
    },
    ...
  ]
}
```

---

#### Get Patient Detail
```http
GET /api/doctors/patients/:patientId
Authorization: Bearer <accessToken>
```

---

#### Get AI Clinical Summary
```http
GET /api/doctors/patients/:patientId/summary
Authorization: Bearer <accessToken>
```

**Response**:
```json
{
  "success": true,
  "data": {
    "summary": "John Doe, 45M, presents with acute chest pain (8/10) and shortness of breath for 2 days. Recent vitals show elevated heart rate (95 bpm) and borderline blood pressure. Rule-based triage: HIGH. ML confidence: 82%. Recommendation: Urgent cardiology consultation..."
  }
}
```

---

#### Override Triage Decision
```http
POST /api/doctors/patients/:patientId/override
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "priority": "critical",    // new priority level
  "reason": "Based on clinical assessment",
  "notes": "Patient reports severe chest pain with radiation to left arm"
}
```

---

#### Find Similar Cases
```http
GET /api/doctors/patients/:patientId/similarity
Authorization: Bearer <accessToken>

?limit=5&threshold=0.75
```

**Response**:
```json
{
  "success": true,
  "data": {
    "similarCases": [
      {
        "patientId": "...",
        "similarity": 0.89,      // 0-1 scale
        "symptoms": ["chest pain", "shortness of breath"],
        "diagnosis": "Acute coronary syndrome"
      }
    ]
  }
}
```

---

### **Triage Endpoints**

#### Get Latest Triage Result
```http
GET /api/triage/:patientId/latest
Authorization: Bearer <accessToken>
```

---

#### Get Triage History
```http
GET /api/triage/:patientId/history
Authorization: Bearer <accessToken>
?limit=20&skip=0
```

---

### **Reminder Endpoints**

#### Create Reminder
```http
POST /api/reminders
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "title": "Follow-up Appointment",
  "description": "Cardiology follow-up consultation",
  "reminderType": "appointment",    // appointment|medication|activity
  "scheduledFor": "2026-05-20T10:00:00Z",
  "priority": "high"
}
```

---

#### Get Reminders
```http
GET /api/reminders
Authorization: Bearer <accessToken>
?status=pending&limit=10
```

---

### **Error Responses**

All endpoints follow this error format:

```json
{
  "success": false,
  "message": "Error description",
  "errors": [
    {
      "field": "heartRate",
      "message": "Heart rate must be positive"
    }
  ]
}
```

**Common HTTP Status Codes**:
- `200 OK` — Successful request
- `201 Created` — Resource created
- `400 Bad Request` — Invalid input
- `401 Unauthorized` — Missing/invalid token
- `403 Forbidden` — Insufficient permissions
- `404 Not Found` — Resource not found
- `429 Too Many Requests` — Rate limited
- `500 Internal Server Error` — Server error

---

## 🗄️ Database Schema

### **User Collection**
```javascript
{
  _id: ObjectId,
  email: String (unique),
  password: String (hashed with bcrypt),
  firstName: String,
  lastName: String,
  phone: String,
  role: String (enum: 'patient', 'doctor', 'admin'),
  avatar: String (URL),
  createdAt: Date,
  updatedAt: Date,
  isActive: Boolean,
  lastLogin: Date
}
```

### **Patient Collection**
```javascript
{
  _id: ObjectId,
  user: ObjectId (ref: User),
  dateOfBirth: Date,
  gender: String,
  bloodType: String,
  allergies: [String],
  medicalHistory: [String],
  emergencyContact: {
    name: String,
    phone: String,
    relationship: String
  },
  latestVitals: {
    heartRate: Number,
    bloodPressureSystolic: Number,
    bloodPressureDiastolic: Number,
    temperature: Number,
    oxygenSaturation: Number,
    respiratoryRate: Number,
    bloodGlucose: Number,
    recordedAt: Date
  },
  assignedDoctors: [ObjectId] (ref: Doctor),
  createdAt: Date,
  updatedAt: Date
}
```

### **Symptom Collection**
```javascript
{
  _id: ObjectId,
  patient: ObjectId (ref: Patient),
  symptoms: [
    {
      name: String,
      severity: Number (1-10),
      durationDays: Number,
      frequency: String (enum: 'constant', 'intermittent'),
      notes: String
    }
  ],
  currentVitals: {
    // Same structure as Patient.latestVitals
  },
  clinicalInsights: {
    extractedSymptoms: [String],
    extractedMedications: [String],
    conditions: [String]
  },
  createdAt: Date
}
```

### **TriageResult Collection**
```javascript
{
  _id: ObjectId,
  patient: ObjectId (ref: Patient),
  symptomLog: ObjectId (ref: Symptom),
  triggeredBy: ObjectId (ref: User),
  
  ruleEngine: {
    priority: String (enum: 'stable', 'moderate', 'high', 'critical'),
    score: Number (0-100),
    reasoning: [
      {
        factor: String,
        value: String,
        threshold: String,
        contribution: String (enum: 'high', 'medium', 'low'),
        source: String (enum: 'rule_engine', 'ml_model', 'doctor_override')
      }
    ],
    triggeredRules: [String]
  },
  
  mlModel: {
    available: Boolean,
    priority: String,
    probabilityMap: {
      stable: Number,
      moderate: Number,
      high: Number,
      critical: Number
    },
    confidence: Number (0-1),
    modelVersion: String
  },
  
  finalPriority: String,
  finalScore: Number,
  prioritySource: String (enum: 'rule_engine', 'ml_model', 'tie', 'doctor_override'),
  
  doctorOverride: {
    overriddenBy: ObjectId (ref: User),
    originalPriority: String,
    overridePriority: String,
    reason: String,
    clinicalNotes: String,
    overriddenAt: Date
  },
  
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### **MedicalReport Collection**
```javascript
{
  _id: ObjectId,
  patient: ObjectId (ref: Patient),
  uploadedBy: ObjectId (ref: User),
  reportType: String (enum: 'lab', 'imaging', 'discharge', 'prescription', 'other'),
  fileName: String,
  fileUrl: String,
  fileSize: Number,
  mimeType: String,
  
  reportDate: Date,
  parsedData: {
    summary: String,
    extractedText: String,
    entities: {
      tests: [String],
      medications: [String],
      conditions: [String],
      procedures: [String]
    }
  },
  
  isDeleted: Boolean,
  deletedAt: Date,
  createdAt: Date
}
```

### **AuditLog Collection**
```javascript
{
  _id: ObjectId,
  user: ObjectId (ref: User),
  action: String (enum: 'login', 'triage_override', 'report_access', 'patient_view'),
  resource: String (enum: 'patient', 'report', 'triage_result'),
  resourceId: ObjectId,
  changes: {
    before: Object,
    after: Object
  },
  ipAddress: String,
  userAgent: String,
  createdAt: Date
}
```

### **Reminder Collection**
```javascript
{
  _id: ObjectId,
  patient: ObjectId (ref: Patient),
  doctor: ObjectId (ref: User) (optional),
  title: String,
  description: String,
  reminderType: String (enum: 'appointment', 'medication', 'activity'),
  scheduledFor: Date,
  priority: String (enum: 'low', 'medium', 'high'),
  status: String (enum: 'pending', 'sent', 'acknowledged', 'completed'),
  sentAt: Date,
  acknowledgedAt: Date,
  createdAt: Date
}
```

---

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

### **Production Checklist**

- [ ] Set `NODE_ENV=production`
- [ ] Use strong JWT secrets (32+ chars, random)
- [ ] Enable HTTPS/TLS
- [ ] Configure MongoDB Atlas (or production DB)
- [ ] Set up monitoring/logging (New Relic, DataDog, etc.)
- [ ] Configure error tracking (Sentry)
- [ ] Enable rate limiting
- [ ] Set up backup strategy
- [ ] Load test ML service
- [ ] GDPR/HIPAA compliance review

### **Docker Deployment**

**Backend Dockerfile**:
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
CMD ["node", "server.js"]
```

**Frontend Dockerfile**:
```dockerfile
FROM node:18-alpine as builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

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

## 🐛 Troubleshooting

### **Backend Issues**

#### MongoDB Connection Error
```
Error: connect ECONNREFUSED 127.0.0.1:27017
```

**Solution**:
```bash
# Ensure MongoDB is running
mongod --dbpath "C:\data\db"

# Or use MongoDB Atlas
# Update MONGO_URI in .env
```

#### ML Service Unavailable
```
⚠️  ML service unavailable. Using rule-engine only.
```

**Solution**:
- Check if ClinicalBERT service is running: `python clinical_bert_app.py`
- Verify ML_SERVICE_URL in .env matches actual service URL
- Check firewall/ports not blocked

#### LLM API Key Invalid
```
Error: 401 Unauthorized - Invalid API key
```

**Solution**:
- Verify API key in .env (Google Generative AI or OpenAI)
- Check key hasn't been rotated
- Ensure correct model name for chosen provider

### **Frontend Issues**

#### Hot Module Replacement (HMR) Not Working
```
[vite] failed to update on error: 404
```

**Solution**:
```bash
# Restart Vite dev server
npm run dev

# Or clear cache
rm -rf node_modules/.vite
npm run dev
```

#### API 401 Unauthorized
```
fetch failed: 401 Unauthorized
```

**Solution**:
- Check auth context initialized
- Verify token stored in localStorage
- Try logout + login to refresh token

### **ML Service Issues**

#### ClinicalBERT Model Download Failed
```
requests.exceptions.ConnectionError: Max retries exceeded
```

**Solution**:
- Check internet connection
- Manual model download:
  ```bash
  python -m transformers.utils.hub PreTrainedModel --cache_dir ./models
  ```
- Use offline mode (pre-cache models)

#### Out of Memory (OOM) During Inference
```
CUDA out of memory
```

**Solution**:
- Reduce batch size in clinical_bert_app.py
- Use CPU instead of GPU:
  ```python
  device = 'cpu'  # in clinical_bert_app.py
  ```
- Increase server memory allocation

### **Common Errors & Fixes**

| Error | Cause | Fix |
|---|---|---|
| `SyntaxError: Unexpected token` | Old Node version | Update to v18+ |
| `TypeError: Cannot read property 'x' of undefined` | Uninitialized state | Check React state initialization |
| `EACCES: permission denied` | File permissions | Run with sudo or fix permissions |
| `EADDRINUSE: address already in use :::5000` | Port already in use | Kill process: `lsof -i :5000` then kill |
| `Module not found: 'fastapi'` | Python dependencies not installed | `pip install -r requirements.txt` |

---

## 📝 Contributing

### **Code Style**

- **JavaScript**: ESLint + Prettier
- **Python**: PEP 8 + Black
- **Commits**: Conventional Commits (feat:, fix:, docs:, test:)

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

### **Pull Request Process**

1. Fork repository
2. Create feature branch: `git checkout -b feature/my-feature`
3. Commit changes: `git commit -m "feat: add my feature"`
4. Push to branch: `git push origin feature/my-feature`
5. Open PR against `develop` branch
6. Code review + approval required
7. Merge when tests pass

---

## ⚖️ Legal Disclaimer

**CRITICAL**: VitalPath is a **decision-support tool only**, not a medical device.

### Key Points

❌ **VitalPath CANNOT**:
- Provide medical diagnoses
- Recommend treatments or medications
- Replace clinical judgment
- Guarantee triage accuracy
- Make medical decisions

✅ **VitalPath IS**:
- A tool to assist healthcare professionals
- Fully reviewable and overridable by doctors
- Transparent in its reasoning
- Logged for audit trail
- Decision-support only

### Clinical Responsibility

- **A licensed healthcare professional must review and validate every recommendation**
- Doctors retain full clinical authority
- Triage outputs are suggestions, not mandates
- All clinical decisions must comply with local regulations and standards
- Hospital policies override system recommendations

### Liability

- Users assume full responsibility for clinical decisions
- VitalPath developers assume no liability for patient outcomes
- Always follow your institution's protocols and guidelines
- Escalate critical cases immediately regardless of triage output

### Regulatory Status

- **NOT FDA-cleared** as medical device
- **For healthcare professional use only**
- **Requires clinical governance oversight**
- **Subject to institutional compliance policies**

---

## 📞 Support & Contact

- **Issues**: GitHub Issues
- **Documentation**: [Wiki](https://github.com/Ansukr07/VitalPath/wiki)
- **Email**: support@vitalpath.com
- **Slack Community**: [Join our Slack](https://vitalpath.slack.com)

---

## 📄 License

Copyright © 2026 VitalPath. All rights reserved.

This software is proprietary and confidential. Unauthorized copying or use is strictly prohibited.

---

## 🙏 Acknowledgments

- **ClinicalBERT**: Hugging Face Transformers
- **FastAPI**: Sebastián Ramírez
- **React 19**: Meta/Facebook team
- **Vite**: Evan You
- **MongoDB**: MongoDB Inc.

---

Built with ❤️ for better healthcare outcomes.

**Questions? Check the [Documentation Wiki](https://github.com/Ansukr07/VitalPath/wiki) or open an issue!**
