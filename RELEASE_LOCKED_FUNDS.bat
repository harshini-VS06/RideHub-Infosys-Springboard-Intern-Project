@echo off
echo ================================
echo   Releasing Locked Wallet Funds
echo ================================
echo.
echo This script will trigger the manual release of locked funds
echo for all completed rides.
echo.
pause

echo.
echo Calling API endpoint...
echo.

curl -X POST http://localhost:8080/api/admin/wallet/release-locked-funds ^
  -H "Authorization: Bearer %TOKEN%" ^
  -H "Content-Type: application/json"

echo.
echo.
echo ================================
echo   Operation Complete
echo ================================
echo.
echo Check the backend console logs for details.
echo The locked balance should now be transferred to available balance.
echo.
pause
