@echo off
echo ========================================================
echo   Starting Claims Reconciliation System Locally
echo ========================================================

cd /d "%~dp0"

echo [1/2] Starting FastAPI Backend on port 8000...
start "Claim Backend (FastAPI)" cmd /k "backend\.venv\Scripts\python.exe -m uvicorn backend.app.main:app --port 8000 --reload"

echo [2/2] Starting React Vite Frontend on port 3000...
start "Claim Frontend (Vite)" cmd /k "cd frontend && npm run dev"

timeout /t 3 >nul
echo.
echo ========================================================
echo   Both services started!
echo   - Web Dashboard:  http://localhost:3000
echo   - API Swagger UI: http://localhost:8000/docs
echo ========================================================
start http://localhost:3000
