@echo off
echo ====================================
echo Finding your computer's IP address
echo ====================================
echo.

ipconfig | findstr /i "IPv4"

echo.
echo ====================================
echo Copy one of the IPv4 addresses above
echo Update .env file with:
echo EXPO_PUBLIC_API_URL=http://YOUR_IP:8000
echo ====================================
pause
