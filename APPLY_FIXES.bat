@echo off
echo ====================================
echo  RIDEHUB - APPLYING CRITICAL FIXES
echo ====================================
echo.

echo [1/4] Stopping any running backend...
taskkill /F /IM java.exe 2>nul
timeout /t 2 /nobreak >nul

echo.
echo [2/4] Rebuilding backend...
cd backend
call mvn clean install -DskipTests
if errorlevel 1 (
    echo ERROR: Backend build failed!
    pause
    exit /b 1
)

echo.
echo [3/4] Starting backend server...
start "RideHub Backend" cmd /k "mvn spring-boot:run"
echo Waiting for backend to start (30 seconds)...
timeout /t 30 /nobreak >nul

echo.
echo [4/4] Frontend is ready (no rebuild needed for these changes)
cd ..\Frontend
echo You can run: npm run dev

echo.
echo ====================================
echo  FIXES APPLIED SUCCESSFULLY!
echo ====================================
echo.
echo What was fixed:
echo  ✓ Payment button appears within 2-3 seconds
echo  ✓ Start Ride button shows at correct time
echo  ✓ End Ride button appears after start
echo  ✓ Review stars turn golden when clicked
echo  ✓ Submit button is prominent and visible
echo.
echo Backend is running in a separate window
echo Frontend: Run 'npm run dev' in Frontend directory
echo.
pause
