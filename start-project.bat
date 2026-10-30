@echo off
title Dhruv Pharma Launcher
echo ============================================================
echo           Launching Dhruv Pharma Full-Stack System
echo ============================================================
echo.

cd /d "%~dp0"

echo [1/2] Starting Python FastAPI Backend Server on port 8000...
start "Dhruv Pharma - Backend API (Port 8000)" cmd /k "python -m uvicorn main:app --app-dir backend --host 0.0.0.0 --port 8000 --reload"

timeout /t 2 /nobreak >nul

echo [2/2] Starting React Vite Frontend Server on port 5173...
start "Dhruv Pharma - Frontend UI (Port 5173)" cmd /k "cd frontend && npm run dev"

timeout /t 3 /nobreak >nul

echo Opening browser at http://localhost:5173/ ...
start http://localhost:5173/

echo.
echo ============================================================
echo   Dhruv Pharma is running!
echo   Frontend: http://localhost:5173
echo   Backend:  http://localhost:8000
echo   Keep the two command windows open while working.
echo ============================================================
pause

