@echo off
echo ========================================
echo Starting Mobile App (Expo)
echo ========================================
echo.

cd mobile

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

REM Get local IP address
echo.
echo Getting local IP address...
call get-ip.bat

REM Start Expo
echo.
echo Starting Expo development server...
echo.
echo Scan the QR code with Expo Go app on your phone
echo Or press 'a' for Android emulator, 'i' for iOS simulator
echo.
npm start

pause
