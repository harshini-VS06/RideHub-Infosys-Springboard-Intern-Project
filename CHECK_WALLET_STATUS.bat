@echo off
echo ============================================
echo   Wallet Status Verification
echo ============================================
echo.
echo This script checks if the wallet fix is working
echo.

set /p TOKEN="Enter your authentication token: "

echo.
echo Checking wallet status...
echo.

curl -X GET http://localhost:8080/api/wallet/my-wallet ^
  -H "Authorization: Bearer %TOKEN%" ^
  -H "Content-Type: application/json"

echo.
echo.
echo ============================================
echo.
echo Check the response above:
echo - "lockedBalance": should be 0.00 or lower than before
echo - "availableBalance": should be higher than before
echo - "totalEarnings": should remain the same
echo.
echo If locked balance is still high, run REBUILD_AND_FIX.bat
echo.
pause
