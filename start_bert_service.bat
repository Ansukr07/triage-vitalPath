@echo off
echo [VitalPath] Starting ClinicalBERT Microservice...
echo.

if not exist venv (
    echo Creating virtual environment...
    python -m venv venv
)

echo Activating virtual environment...
call venv\Scripts\activate

echo Installing/verifying dependencies...
pip install -r backend\scripts\requirements.txt -q

echo.
echo [SUCCESS] Starting ClinicalBERT service on port 8001...
echo [INFO]    Endpoint: http://127.0.0.1:8001
echo [INFO]    Health:   http://127.0.0.1:8001/health
echo [INFO]    Extract:  POST http://127.0.0.1:8001/extract
echo [INFO]    Classify: POST http://127.0.0.1:8001/classify
echo.
python backend\scripts\clinical_bert_app.py
pause
