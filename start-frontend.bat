@echo off
echo ========================================
echo Starting Frontend Server
echo ========================================
echo.

cd frontend

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js is not installed or not in PATH
    pause
    exit /b 1
)

REM Install dependencies if node_modules doesn't exist
if not exist "node_modules" (
    echo Installing dependencies...
    call npm install
)

REM Start the development server
echo.
echo Starting Next.js development server...
echo Frontend will be available at: http://localhost:3000
echo.
npm run dev

pause
