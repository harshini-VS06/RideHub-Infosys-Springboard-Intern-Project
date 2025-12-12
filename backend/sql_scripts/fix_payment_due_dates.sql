-- ==============================================================================
-- FIX PAYMENT DUE DATES - Updated for 24 Hours Before Ride
-- ==============================================================================
-- This script fixes the payment_due_at column for existing bookings to use
-- 24 hours before ride time (instead of the old 42 hours)
-- 
-- IMPORTANT: Run this AFTER updating the backend code and restarting the server
-- ==============================================================================

-- Step 1: Preview what will be changed (SAFE - READ ONLY)
-- This shows you exactly what bookings will be updated and how
SELECT 
    b.id AS booking_id,
    b.status,
    CONCAT(r.ride_date, ' ', r.ride_time) AS ride_datetime,
    b.payment_due_at AS old_payment_due_at,
    TIMESTAMPDIFF(HOUR, b.payment_due_at, CONCAT(r.ride_date, ' ', r.ride_time)) AS old_hours_before_ride,
    DATE_SUB(CONCAT(r.ride_date, ' ', r.ride_time), INTERVAL 24 HOUR) AS new_payment_due_at,
    '24 hours' AS new_hours_before_ride,
    CASE 
        WHEN DATE_SUB(CONCAT(r.ride_date, ' ', r.ride_time), INTERVAL 24 HOUR) <= NOW() 
        THEN 'Will become PAYMENT_PENDING immediately'
        ELSE CONCAT('Payment due in ', 
                    TIMESTAMPDIFF(HOUR, NOW(), DATE_SUB(CONCAT(r.ride_date, ' ', r.ride_time), INTERVAL 24 HOUR)), 
                    ' hours')
    END AS status_after_update
FROM bookings b
JOIN rides r ON b.ride_id = r.id
WHERE b.status = 'TENTATIVE'
ORDER BY r.ride_date, r.ride_time;

-- ==============================================================================
-- Step 2: ACTUALLY UPDATE THE DATA (DESTRUCTIVE - CHANGES DATABASE)
-- Uncomment the block below ONLY after reviewing Step 1 results
-- ==============================================================================
/*
START TRANSACTION;

-- Update all TENTATIVE bookings to use 24-hour payment due time
UPDATE bookings b
JOIN rides r ON b.ride_id = r.id
SET 
    b.payment_due_at = DATE_SUB(CONCAT(r.ride_date, ' ', r.ride_time), INTERVAL 24 HOUR),
    b.payment_request_sent = false  -- Reset this flag so scheduler can process again
WHERE b.status = 'TENTATIVE';

-- Show results
SELECT 
    CONCAT('✓ Updated ', ROW_COUNT(), ' TENTATIVE bookings to 24-hour payment due time') AS result;

COMMIT;
*/

-- ==============================================================================
-- Step 3: Verification Query (Run AFTER Step 2)
-- This confirms all bookings now have payment due at exactly 24 hours before ride
-- ==============================================================================
/*
SELECT 
    b.id,
    b.status,
    CONCAT(r.ride_date, ' ', r.ride_time) AS ride_datetime,
    b.payment_due_at,
    TIMESTAMPDIFF(HOUR, b.payment_due_at, CONCAT(r.ride_date, ' ', r.ride_time)) AS hours_before_ride,
    b.payment_request_sent,
    CASE 
        WHEN TIMESTAMPDIFF(HOUR, b.payment_due_at, CONCAT(r.ride_date, ' ', r.ride_time)) = 24 
        THEN '✓ CORRECT'
        ELSE '✗ WRONG'
    END AS validation
FROM bookings b
JOIN rides r ON b.ride_id = r.id
WHERE b.status IN ('TENTATIVE', 'PAYMENT_PENDING')
ORDER BY r.ride_date, r.ride_time;
*/

-- ==============================================================================
-- NOTES:
-- ==============================================================================
-- 1. After running Step 2, the scheduler will automatically process bookings
--    where payment_due_at <= NOW() within 10 minutes
-- 
-- 2. For your specific booking (Ride: Dec 4 at 19:15):
--    - Old payment_due_at: Dec 2 at 01:15 (42 hours before) 
--    - New payment_due_at: Dec 3 at 19:15 (24 hours before)
--    - Current time: Dec 3 at ~15:00
--    - Status after update: Will remain TENTATIVE until Dec 3 at 19:15
--    - Payment button appears: Between Dec 3 at 19:15 and 19:25 (within 10 mins)
--
-- 3. If payment_due_at is already in the past (like in your current booking),
--    the scheduler will pick it up within 10 minutes and change status to
--    PAYMENT_PENDING, making the pay button appear.
-- ==============================================================================
