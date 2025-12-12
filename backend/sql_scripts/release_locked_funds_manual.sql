-- SQL Script to Manually Release Locked Funds for Completed Rides
-- Run this script to transfer locked balance to available balance for all completed bookings

-- Step 1: View current wallet status (for verification)
SELECT 
    hw.id as wallet_id,
    u.name as driver_name,
    u.email as driver_email,
    hw.locked_balance,
    hw.available_balance,
    hw.total_earnings
FROM hub_wallet hw
JOIN users u ON hw.driver_id = u.id
WHERE hw.locked_balance > 0;

-- Step 2: Find all COMPLETED bookings that haven't been processed
SELECT 
    b.id as booking_id,
    b.status,
    b.final_price,
    b.ride_ended_at,
    p.id as payment_id,
    p.amount as payment_amount,
    rd.name as driver_name,
    hw.locked_balance,
    hw.available_balance
FROM bookings b
JOIN payments p ON b.id = p.booking_id
JOIN rides r ON b.ride_id = r.id
JOIN users rd ON r.driver_id = rd.id
JOIN hub_wallet hw ON rd.id = hw.driver_id
WHERE b.status IN ('COMPLETED', 'DEBOARDED')
  AND b.ride_ended_at IS NOT NULL
  AND p.status = 'COMPLETED'
  AND hw.locked_balance >= p.amount;

-- Step 3: Manually transfer locked to available for COMPLETED bookings
-- WARNING: This updates the database directly. Backup first!

-- For each driver with locked balance from completed rides:
-- Replace {driver_id} with actual driver ID from above query

UPDATE hub_wallet 
SET 
    locked_balance = locked_balance - (
        SELECT COALESCE(SUM(p.amount), 0)
        FROM bookings b
        JOIN payments p ON b.id = p.booking_id
        JOIN rides r ON b.ride_id = r.id
        WHERE r.driver_id = {driver_id}
          AND b.status IN ('COMPLETED', 'DEBOARDED')
          AND b.ride_ended_at IS NOT NULL
          AND p.status = 'COMPLETED'
    ),
    available_balance = available_balance + (
        SELECT COALESCE(SUM(p.amount), 0)
        FROM bookings b
        JOIN payments p ON b.id = p.booking_id
        JOIN rides r ON b.ride_id = r.id
        WHERE r.driver_id = {driver_id}
          AND b.status IN ('COMPLETED', 'DEBOARDED')
          AND b.ride_ended_at IS NOT NULL
          AND p.status = 'COMPLETED'
    ),
    updated_at = CURRENT_TIMESTAMP
WHERE driver_id = {driver_id}
  AND locked_balance > 0;

-- Step 4: Create wallet transactions for audit trail
-- Run this for each booking that was processed

INSERT INTO wallet_transactions (
    wallet_id,
    booking_id,
    payment_id,
    type,
    amount,
    balance_after,
    description,
    created_at
)
SELECT 
    hw.id as wallet_id,
    b.id as booking_id,
    p.id as payment_id,
    'RELEASE' as type,
    p.amount,
    hw.available_balance as balance_after,
    CONCAT('Manual release - Ride completed on ', b.ride_ended_at) as description,
    CURRENT_TIMESTAMP as created_at
FROM bookings b
JOIN payments p ON b.id = p.booking_id
JOIN rides r ON b.ride_id = r.id
JOIN users rd ON r.driver_id = rd.id
JOIN hub_wallet hw ON rd.id = hw.driver_id
WHERE b.status IN ('COMPLETED', 'DEBOARDED')
  AND b.ride_ended_at IS NOT NULL
  AND p.status = 'COMPLETED'
  AND rd.id = {driver_id};

-- Step 5: Verification - Check updated wallet status
SELECT 
    hw.id as wallet_id,
    u.name as driver_name,
    u.email as driver_email,
    hw.locked_balance,
    hw.available_balance,
    hw.total_earnings,
    hw.updated_at
FROM hub_wallet hw
JOIN users u ON hw.driver_id = u.id
WHERE u.id = {driver_id};

-- Step 6: View transaction history for verification
SELECT 
    wt.id,
    wt.type,
    wt.amount,
    wt.balance_after,
    wt.description,
    wt.created_at,
    b.id as booking_id
FROM wallet_transactions wt
LEFT JOIN bookings b ON wt.booking_id = b.id
WHERE wt.wallet_id = (
    SELECT id FROM hub_wallet WHERE driver_id = {driver_id}
)
ORDER BY wt.created_at DESC
LIMIT 10;
