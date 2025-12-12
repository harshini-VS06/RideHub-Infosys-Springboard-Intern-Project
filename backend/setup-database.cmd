@echo off
echo ======================================================
echo RideHub Database Setup
echo ======================================================
echo.
echo This script will:
echo 1. Check if PostgreSQL is running
echo 2. Create the ridehub_db database if it doesn't exist
echo 3. Verify the connection
echo.
echo Database Details:
echo - Host: localhost
echo - Port: 5432
echo - Database: ridehub_db
echo - Username: postgres
echo - Password: ridehub@2006
echo.
pause
echo.

echo [1/4] Checking PostgreSQL service...
sc query postgresql-x64-15 | findstr "RUNNING" >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo PostgreSQL is not running. Starting it...
    net start postgresql-x64-15
    if %ERRORLEVEL% NEQ 0 (
        echo ERROR: Could not start PostgreSQL!
        echo Please start PostgreSQL service manually.
        pause
        exit /b 1
    )
    echo PostgreSQL started!
    timeout /t 3 >nul
) else (
    echo PostgreSQL is running.
)
echo.

echo [2/4] Checking if database exists...
psql -U postgres -d ridehub_db -c "SELECT 1;" >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo Database does not exist. Creating...
    psql -U postgres -c "CREATE DATABASE ridehub_db;"
    if %ERRORLEVEL% NEQ 0 (
        echo ERROR: Failed to create database!
        pause
        exit /b 1
    )
    echo Database created successfully!
) else (
    echo Database already exists.
)
echo.

echo [3/4] Verifying connection...
psql -U postgres -d ridehub_db -c "SELECT version();"
echo.

echo [4/4] Checking tables...
echo Current tables in ridehub_db:
psql -U postgres -d ridehub_db -c "\dt"
echo.

echo ======================================================
echo Database Setup Complete!
echo ======================================================
echo.
echo You can now run the backend application:
echo   start-backend.cmd
echo.
echo Or manually:
echo   mvn spring-boot:run
echo.
pause
