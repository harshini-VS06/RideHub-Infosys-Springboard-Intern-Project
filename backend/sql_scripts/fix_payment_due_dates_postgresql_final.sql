-- ==============================================================================
-- FIX PAYMENT DUE DATES - PostgreSQL Compatible (FINAL CORRECTED VERSION)
-- ==============================================================================
-- This script fixes the syntax error you encountered
-- Run this in pgAdmin4 to preview and update payment due dates
-- ==============================================================================

-- Step 1: Preview what will be changed (SAFE - READ ONLY)
-- This query is now fully PostgreSQL compatible
SELECT 
    b.id AS booking_id,
    b.status,
    (r.ride_date + r.ride_time) AS ride_datetime,
    b.payment_due_at AS old_payment_due_at,
    EXTRACT(EPOCH FROM (b.payment_due_at - (r.ride_date + r.ride_time)))/3600 AS old_hours_before_ride,
    ((r.ride_date + r.ride_time) - INTERVAL '24 hours') AS new_payment_due_at,
    24 AS new_hours_before_ride,
    CASE 
        WHEN ((r.ride_date + r.ride_time) - INTERVAL '24 hours') <= NOW() 
        THEN 'Will become PAYMENT_PENDING immediately'
        ELSE 'Payment due in ' || 
             ROUND(EXTRACT(EPOCH FROM (((r.ride_date + r.ride_time) - INTERVAL '24 hours') - NOW()))/3600, 1) || 
             ' hours'
    END AS status_after_update
FROM bookings b
JOIN rides r ON b.ride_id = r.id
WHERE b.status = 'TENTATIVE'
ORDER BY r.ride_date, r.ride_time;

-- ==============================================================================
-- Step 2: ACTUALLY UPDATE THE DATA 
-- Uncomment the block below ONLY after reviewing Step 1 results
-- ==============================================================================
/*
BEGIN;

-- Update all TENTATIVE bookings to use 24-hour payment due time
UPDATE bookings b
SET 
    payment_due_at = ((r.ride_date + r.ride_time) - INTERVAL '24 hours'),
    payment_request_sent = false
FROM rides r
WHERE b.ride_id = r.id 
AND b.status = 'TENTATIVE';

-- Show results
SELECT 'Updated ' || COUNT(*) || ' TENTATIVE bookings' AS result
FROM bookings
WHERE status = 'TENTATIVE';

COMMIT;
*/

-- ==============================================================================
-- Step 3: Verification Query (Run AFTER Step 2)
-- ==============================================================================
/*
SELECT 
    b.id,
    b.status,
    (r.ride_date + r.ride_time) AS ride_datetime,
    b.payment_due_at,
    ROUND(EXTRACT(EPOCH FROM ((r.ride_date + r.ride_time) - b.payment_due_at))/3600, 1) AS hours_before_ride,
    CASE 
        WHEN EXTRACT(EPOCH FROM ((r.ride_date + r.ride_time) - b.payment_due_at))/3600 BETWEEN 23.5 AND 24.5
        THEN '✓ CORRECT'
        ELSE '✗ WRONG'
    END AS validation
FROM bookings b
JOIN rides r ON b.ride_id = r.id
WHERE b.status IN ('TENTATIVE', 'PAYMENT_PENDING')
ORDER BY r.ride_date, r.ride_time;
*/
