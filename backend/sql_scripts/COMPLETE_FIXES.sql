-- ==============================================================================
-- COMPLETE DATABASE FIXES FOR RIDEHUB
-- ==============================================================================
-- Run this file in PostgreSQL (pgAdmin4)
-- ==============================================================================

-- Step 1: Fix payment_due_at for all TENTATIVE bookings (24 hours before ride)
-- ==============================================================================
BEGIN;

UPDATE bookings b
SET 
    payment_due_at = (r.ride_date + r.ride_time - INTERVAL '24 hours'),
    payment_request_sent = false
FROM rides r
WHERE b.ride_id = r.id 
AND b.status = 'TENTATIVE';

SELECT 'Step 1: Updated ' || COUNT(*) || ' TENTATIVE bookings to 24-hour payment due time' AS result
FROM bookings
WHERE status = 'TENTATIVE';

COMMIT;

-- ==============================================================================
-- Step 2: Verification Query - Check all bookings
-- ==============================================================================
SELECT 
    b.id AS booking_id,
    b.status,
    (r.ride_date + r.ride_time) AS ride_datetime,
    b.payment_due_at,
    EXTRACT(HOUR FROM (r.ride_date + r.ride_time) - b.payment_due_at) AS hours_before_ride,
    CASE 
        WHEN b.payment_due_at <= NOW() THEN 'Payment Due NOW'
        ELSE 'Payment due in ' || EXTRACT(HOUR FROM b.payment_due_at - NOW()) || ' hours'
    END AS payment_status
FROM bookings b
JOIN rides r ON b.ride_id = r.id
WHERE b.status IN ('TENTATIVE', 'PAYMENT_PENDING', 'CONFIRMED')
ORDER BY r.ride_date, r.ride_time;

-- ==============================================================================
-- Step 3: Check Wallet Configuration
-- ==============================================================================
SELECT 
    u.id AS driver_id,
    u.email AS driver_email,
    COALESCE(w.locked_balance, 0) AS locked_balance,
    COALESCE(w.available_balance, 0) AS available_balance,
    COALESCE(w.total_earnings, 0) AS total_earnings
FROM users u
LEFT JOIN wallets w ON w.driver_id = u.id
WHERE u.role = 'DRIVER';

-- ==============================================================================
-- Step 4: Create missing wallets for drivers (if any)
-- ==============================================================================
INSERT INTO wallets (driver_id, locked_balance, available_balance, total_earnings, created_at, updated_at)
SELECT 
    u.id,
    0,
    0,
    0,
    NOW(),
    NOW()
FROM users u
LEFT JOIN wallets w ON w.driver_id = u.id
WHERE u.role = 'DRIVER' 
AND w.id IS NULL;

-- ==============================================================================
-- Step 5: Verify Wallet Creation
-- ==============================================================================
SELECT 'Step 4: Created wallets for ' || COUNT(*) || ' drivers' AS result
FROM users u
INNER JOIN wallets w ON w.driver_id = u.id
WHERE u.role = 'DRIVER';

-- ==============================================================================
-- VERIFICATION COMPLETE
-- ==============================================================================
SELECT 'Database fixes applied successfully!' AS status;
