@echo off
echo ========================================
echo Starting HR Nexus Development Servers
echo ========================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python is not installed or not in PATH
    echo Please install Python 3.8 or higher
    pause
    exit /b 1
)

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js 18 or higher
    pause
    exit /b 1
)

echo [1/4] Checking backend dependencies...
cd backend
if not exist "venv" (
    echo Creating Python virtual environment...
    python -m venv venv
)

echo [2/4] Starting Backend Server...
start "Backend Server" cmd /k "cd /d %CD% && venv\Scripts\activate && pip install -r requirements.txt >nul 2>&1 && echo Backend dependencies installed && python main.py"

cd ..

echo [3/4] Checking frontend dependencies...
cd frontend
if not exist "node_modules" (
    echo Installing frontend dependencies...
    call npm install
)

echo [4/4] Starting Frontend Server...
start "Frontend Server" cmd /k "cd /d %CD% && npm run dev"

cd ..

echo.
echo ========================================
echo Servers are starting...
echo ========================================
echo.
echo Backend:  http://localhost:8000
echo Frontend: http://localhost:3000
echo.
echo Press any key to stop all servers...
pause >nul

echo.
echo Stopping servers...
taskkill /FI "WindowTitle eq Backend Server*" /T /F >nul 2>&1
taskkill /FI "WindowTitle eq Frontend Server*" /T /F >nul 2>&1
echo Servers stopped.
pause
