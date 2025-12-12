-- ==============================================================================
-- FIX PAYMENT DUE DATES - PostgreSQL Compatible Version (CORRECTED)
-- ==============================================================================
-- This script fixes the payment_due_at column for existing bookings to use
-- 24 hours before ride time (instead of the old 42 hours)
-- 
-- IMPORTANT: Run this in pgAdmin4 AFTER updating the backend code
-- ==============================================================================

-- Step 1: Preview what will be changed (SAFE - READ ONLY)
-- This shows you exactly what bookings will be updated and how
SELECT 
    b.id AS booking_id,
    b.status,
    (r.ride_date + r.ride_time) AS ride_datetime,
    b.payment_due_at AS old_payment_due_at,
    EXTRACT(HOUR FROM (b.payment_due_at - (r.ride_date + r.ride_time))) AS old_hours_before_ride,
    ((r.ride_date + r.ride_time) - INTERVAL '24 hours') AS new_payment_due_at,
    '24 hours' AS new_hours_before_ride,
    CASE 
        WHEN ((r.ride_date + r.ride_time) - INTERVAL '24 hours') <= NOW() 
        THEN 'Will become PAYMENT_PENDING immediately'
        ELSE 'Payment due in ' || 
             CAST(EXTRACT(HOUR FROM ((r.ride_date + r.ride_time) - INTERVAL '24 hours') - NOW()) AS TEXT) || 
             ' hours'
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
BEGIN;

-- Update all TENTATIVE bookings to use 24-hour payment due time
UPDATE bookings b
SET 
    payment_due_at = ((r.ride_date + r.ride_time) - INTERVAL '24 hours'),
    payment_request_sent = false  -- Reset this flag so scheduler can process again
FROM rides r
WHERE b.ride_id = r.id 
AND b.status = 'TENTATIVE';

-- Show results
SELECT 'Updated ' || COUNT(*) || ' TENTATIVE bookings to 24-hour payment due time' AS result
FROM bookings
WHERE status = 'TENTATIVE';

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
    (r.ride_date + r.ride_time) AS ride_datetime,
    b.payment_due_at,
    EXTRACT(HOUR FROM ((r.ride_date + r.ride_time) - b.payment_due_at)) AS hours_before_ride,
    b.payment_request_sent,
    CASE 
        WHEN EXTRACT(HOUR FROM ((r.ride_date + r.ride_time) - b.payment_due_at)) = 24 
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
-- 1. PostgreSQL-specific syntax fixes applied:
--    ✓ Changed DATE_SUB() to (date + time - INTERVAL)
--    ✓ Changed CONCAT(date, ' ', time) to (date + time)
--    ✓ Changed TIMESTAMPDIFF() to EXTRACT(HOUR FROM ...)
--    ✓ Changed CONCAT() for strings to || operator
--    ✓ Added CAST(...AS TEXT) for concatenation
-- 
-- 2. After running Step 2, the scheduler will automatically process bookings
--    where payment_due_at <= NOW() within 10 minutes
-- 
-- 3. The scheduler updates status from TENTATIVE to PAYMENT_PENDING
-- 
-- 4. If payment_due_at is already in the past, the scheduler will pick it up
--    within 10 minutes and change status to PAYMENT_PENDING
-- ==============================================================================
