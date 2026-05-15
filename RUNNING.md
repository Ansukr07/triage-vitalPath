# VitalPath — Running the Project

> This guide walks you through setting up and running all three services that make up VitalPath.

## Prerequisites

| Tool | Version | Purpose |
|------|---------|---------|
| **Node.js** | v18+ | Backend & Frontend |
| **npm** | v9+ | Package management |
| **MongoDB** | v6+ | Database (local or Atlas) |
| **Python** | 3.9+ | ClinicalBERT microservice |
| **Poppler** | latest | PDF → image conversion for OCR *(optional, only needed for scanned-PDF processing)* |

---

## 1 · Backend (Node.js / Express)

### 1.1 Install dependencies

```bash
cd backend
npm install
```

### 1.2 Configure environment variables

Copy the example file and fill in your values:

```bash
cp .env.example .env
```

| Variable | Default / Example | Description |
|----------|-------------------|-------------|
| `PORT` | `5000` | Express server port |
| `MONGO_URI` | `mongodb://localhost:27017/medic_db` | MongoDB connection string |
| `JWT_SECRET` | *(generate a strong random string)* | Secret for signing access tokens |
| `JWT_REFRESH_SECRET` | *(generate a strong random string)* | Secret for signing refresh tokens |
| `JWT_EXPIRES_IN` | `1d` | Access token lifetime |
| `JWT_REFRESH_EXPIRES_IN` | `7d` | Refresh token lifetime |
| `ML_SERVICE_URL` | `http://localhost:8000/predict` | ML prediction service endpoint |
| `LLM_API_KEY` | *(your API key)* | Gemini / OpenAI API key for report parsing |
| `LLM_MODEL` | `gpt-4o-mini` | LLM model name (e.g. `gemini-2.0-flash`, `gpt-4o-mini`) |
| `UPLOAD_DIR` | `uploads` | Directory for uploaded files |
| `NODE_ENV` | `development` | `development` or `production` |

### 1.3 Seed the database (optional)

```bash
npm run seed
```

This populates MongoDB with sample demo data (patients, doctors, reports).

### 1.4 Start the server

```bash
# Development (auto-restart on file changes)
npm run dev

# — OR — production
npm start
```

The backend will be available at **http://localhost:5000**.

Health check → `GET http://localhost:5000/api/health`

---

## 2 · Frontend (React 19 / Vite)

### 2.1 Install dependencies

```bash
cd frontend
npm install
```

### 2.2 Start the dev server

```bash
npm run dev
```

The frontend will be available at **http://localhost:5173**.

### 2.3 Production build (optional)

```bash
npm run build
npm run preview   # serves the built output for testing
```

---

## 3 · ClinicalBERT Microservice (Python / FastAPI)

The ClinicalBERT service handles **medical entity extraction** and **triage classification** using transformer models. It also supports **OCR** for scanned PDFs.

### Option A — Use the batch script (Windows)

From the project root:

```bash
start_bert_service.bat
```

This will automatically create a virtual environment, install dependencies, and start the service.

### Option B — Manual setup

```bash
cd backend

# Create & activate a virtual environment
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate    # macOS / Linux

# Install Python dependencies
pip install -r scripts/requirements.txt

# Download the spaCy language model (first time only)
python -m spacy download en_core_web_sm

# Start the service
python scripts/clinical_bert_app.py
```

The ClinicalBERT service runs at **http://127.0.0.1:8001**.

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/extract` | POST | Extract medical entities from text |
| `/classify` | POST | Classify triage urgency |

> **Note on OCR:** If you plan to process scanned PDFs, you also need **Poppler** installed and on your system PATH. On Windows you can install it via `choco install poppler` or download the binaries manually.

---

## 4 · Running Everything Together

Open **three terminals** and run each service:

| Terminal | Directory | Command |
|----------|-----------|---------|
| 1 | `backend/` | `npm run dev` |
| 2 | `frontend/` | `npm run dev` |
| 3 | project root | `start_bert_service.bat` *(or manual steps from §3B)* |

### Startup order

1. **MongoDB** — make sure it's running first (local `mongod` or Atlas).
2. **Backend** — connects to MongoDB on start.
3. **ClinicalBERT** — independent microservice, can start in any order.
4. **Frontend** — calls the backend API at `http://localhost:5000`.

---

## 5 · Quick Verification

Once all services are up, hit these endpoints to verify:

```bash
# Backend health
curl http://localhost:5000/api/health

# ClinicalBERT health
curl http://127.0.0.1:8001/health

# Frontend
# Open http://localhost:5173 in your browser
```

---

## 6 · Common Issues

| Symptom | Fix |
|---------|-----|
| `MongoDB connection error` | Ensure `mongod` is running and `MONGO_URI` is correct |
| `EADDRINUSE` on port 5000 | Another process is using the port — kill it or change `PORT` in `.env` |
| `torch` install fails | Use `pip install torch --index-url https://download.pytorch.org/whl/cpu` for CPU-only |
| Scanned PDFs return no text | Install **Poppler** and make sure `pdftoppm` is on your PATH |
| LLM 404 errors | Double-check `LLM_API_KEY` and `LLM_MODEL` — Gemini models use `@google/generative-ai` |

---

## 7 · Available npm Scripts

### Backend (`backend/`)

| Script | Command | Description |
|--------|---------|-------------|
| `npm start` | `node server.js` | Start production server |
| `npm run dev` | `nodemon server.js` | Start with auto-reload |
| `npm run seed` | `node scripts/seed.js` | Seed demo data |
| `npm test` | `jest --runInBand` | Run tests |

### Frontend (`frontend/`)

| Script | Command | Description |
|--------|---------|-------------|
| `npm run dev` | `vite` | Start dev server |
| `npm run build` | `vite build` | Production build |
| `npm run preview` | `vite preview` | Preview production build |
| `npm run lint` | `eslint .` | Lint source files |
