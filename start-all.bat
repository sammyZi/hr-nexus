@echo off
echo ========================================
echo Starting All HR Nexus Services
echo ========================================
echo.
echo This will start:
echo - Backend Server (Port 8000)
echo - Frontend Server (Port 3000)
echo - Mobile App (Expo)
echo.
echo Press any key to continue or Ctrl+C to cancel...
pause >nul

REM Start Backend
echo.
echo [1/3] Starting Backend...
start "HR Nexus - Backend" cmd /k "start-backend.bat"
timeout /t 3 /nobreak >nul

REM Start Frontend
echo [2/3] Starting Frontend...
start "HR Nexus - Frontend" cmd /k "start-frontend.bat"
timeout /t 3 /nobreak >nul

REM Start Mobile
echo [3/3] Starting Mobile...
start "HR Nexus - Mobile" cmd /k "start-mobile.bat"

echo.
echo ========================================
echo All services are starting!
echo ========================================
echo.
echo Backend:  http://localhost:8000
echo Frontend: http://localhost:3000
echo Mobile:   Check the Expo window
echo.
echo Close the individual windows to stop each service.
echo.
pause
