@echo off
echo ======================================================
echo RideHub Backend Startup Script
echo ======================================================
echo.

cd /d "%~dp0"

echo [Step 1] Checking if PostgreSQL is running...
sc query postgresql-x64-15 | findstr "RUNNING" >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo PostgreSQL is NOT running. Attempting to start...
    net start postgresql-x64-15
    if %ERRORLEVEL% NEQ 0 (
        echo ERROR: Failed to start PostgreSQL service!
        echo Please start it manually from Services or run as Administrator.
        pause
        exit /b 1
    )
    echo PostgreSQL started successfully!
    timeout /t 3 >nul
) else (
    echo PostgreSQL is already running.
)
echo.

echo [Step 2] Testing database connection...
psql -U postgres -d ridehub_db -c "SELECT 1;" >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo Database 'ridehub_db' not found or connection failed.
    echo Attempting to create database...
    psql -U postgres -c "CREATE DATABASE ridehub_db;" 2>&1
    if %ERRORLEVEL% NEQ 0 (
        echo ERROR: Failed to create database!
        echo Please create it manually: psql -U postgres -c "CREATE DATABASE ridehub_db;"
        pause
        exit /b 1
    )
    echo Database created successfully!
) else (
    echo Database connection OK.
)
echo.

echo [Step 3] Checking port 8080...
netstat -ano | findstr :8080 >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo WARNING: Port 8080 is already in use!
    echo.
    echo Options:
    echo 1. Kill the process using port 8080
    echo 2. Change port in application.properties
    echo.
    netstat -ano | findstr :8080
    echo.
    set /p choice="Continue anyway? (y/n): "
    if /i not "%choice%"=="y" (
        echo Startup cancelled.
        pause
        exit /b 1
    )
) else (
    echo Port 8080 is available.
)
echo.

echo [Step 4] Starting Spring Boot application...
echo ======================================================
echo.
echo Running: mvn spring-boot:run
echo.
echo Watch for these messages:
echo - "Started RideHubApplication" = SUCCESS
echo - "APPLICATION FAILED TO START" = ERROR (read the message above it)
echo.
echo Press Ctrl+C to stop the application when needed.
echo.
echo ======================================================
echo.

mvn spring-boot:run

echo.
echo ======================================================
echo Application has stopped.
echo.
echo If the application failed to start:
echo 1. Run 'diagnose.cmd' to check for issues
echo 2. Run 'mvn spring-boot:run -X > output.log 2>&1' for detailed logs
echo 3. Check output.log for the exact error
echo.
pause
