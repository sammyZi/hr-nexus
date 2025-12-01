@echo off
echo ========================================
echo HR Nexus Backend Setup
echo ========================================
echo.

echo [1/4] Creating virtual environment...
python -m venv venv
if errorlevel 1 (
    echo Error: Failed to create virtual environment
    pause
    exit /b 1
)

echo [2/4] Activating virtual environment...
call venv\Scripts\activate.bat

echo [3/4] Installing dependencies...
pip install -r requirements.txt
if errorlevel 1 (
    echo Error: Failed to install dependencies
    pause
    exit /b 1
)

echo [4/4] Seeding database with sample data...
python seed_data.py
if errorlevel 1 (
    echo Error: Failed to seed database
    echo Make sure MongoDB is running!
    pause
    exit /b 1
)

echo.
echo ========================================
echo Setup completed successfully!
echo ========================================
echo.
echo To start the server, run:
echo   venv\Scripts\activate
echo   uvicorn main:app --reload --port 8000
echo.
pause
