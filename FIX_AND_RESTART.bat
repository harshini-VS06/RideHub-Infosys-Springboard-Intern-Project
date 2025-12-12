@echo off
echo ========================================
echo Quick Fix for Payment Timing Issue
echo ========================================
echo.
echo This script will help you fix the payment button timing.
echo.
echo IMPORTANT: You need to run the SQL fix manually first!
echo.
echo Steps:
echo 1. Open MySQL Workbench or your SQL client
echo 2. Run the file: backend\sql_scripts\fix_payment_due_dates.sql
echo 3. Follow Step 1 (preview), Step 2 (update), Step 3 (verify)
echo 4. Then come back and press any key to restart the backend
echo.
pause
echo.
echo Starting backend with updated code...
echo.
cd backend
call mvn spring-boot:run
