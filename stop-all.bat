@echo off
echo ========================================
echo Stopping All HR Nexus Services
echo ========================================
echo.

echo Stopping Backend Server...
taskkill /FI "WindowTitle eq HR Nexus - Backend*" /T /F >nul 2>&1
taskkill /FI "IMAGENAME eq python.exe" /FI "WINDOWTITLE eq *main.py*" /T /F >nul 2>&1

echo Stopping Frontend Server...
taskkill /FI "WindowTitle eq HR Nexus - Frontend*" /T /F >nul 2>&1
taskkill /FI "IMAGENAME eq node.exe" /FI "WINDOWTITLE eq *next*" /T /F >nul 2>&1

echo Stopping Mobile App...
taskkill /FI "WindowTitle eq HR Nexus - Mobile*" /T /F >nul 2>&1
taskkill /FI "IMAGENAME eq node.exe" /FI "WINDOWTITLE eq *expo*" /T /F >nul 2>&1

echo.
echo All services stopped.
echo.
pause
