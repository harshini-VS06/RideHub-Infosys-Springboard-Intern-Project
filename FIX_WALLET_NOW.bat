@echo off
echo ============================================
echo   Quick Database Fix - Release Locked Funds
echo ============================================
echo.
echo This will run the automatic wallet fix script
echo in your PostgreSQL database.
echo.
echo Database: ridehub_db
echo Username: postgres
echo Password: ridehub@2006
echo.
pause

echo.
echo Running automatic wallet fix...
echo.

psql -U postgres -d ridehub_db -f AUTO_FIX_WALLET.sql

echo.
echo ============================================
echo   Check Results Above
echo ============================================
echo.
echo Look for these success messages:
echo   ✓ "Transferred X to available balance"
echo   ✓ "Created RELEASE transaction"
echo   ✓ "WALLET FIX COMPLETED"
echo.
echo Then check the final query results:
echo   - locked_balance should be 0.00
echo   - available_balance should be 12590.48
echo.
echo If you see errors:
echo   1. Make sure PostgreSQL is running
echo   2. Check the password is correct
echo   3. Verify database name is ridehub_db
echo.
echo After this completes successfully:
echo   1. Refresh your Driver Dashboard
echo   2. Go to HubWallet tab
echo   3. Verify the balances are correct
echo.
pause
