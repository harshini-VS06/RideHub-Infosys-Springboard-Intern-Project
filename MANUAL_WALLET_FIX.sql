-- ============================================
-- MANUAL WALLET FIX - Direct SQL Method
-- ============================================
-- Run this script in your PostgreSQL database
-- This will manually transfer locked balance to available balance

-- STEP 1: Check current wallet status
SELECT 
    u.id as user_id,
    u.name as driver_name,
    u.email,
    hw.id as wallet_id,
    hw.locked_balance,
    hw.available_balance,
    hw.total_earnings
FROM hub_wallet hw
JOIN users u ON hw.driver_id = u.id
WHERE u.role = 'DRIVER';

-- STEP 2: Check completed bookings with payments
SELECT 
    b.id as booking_id,
    b.status as booking_status,
    b.ride_ended_at,
    p.id as payment_id,
    p.amount as payment_amount,
    p.status as payment_status,
    r.id as ride_id,
    r.driver_id
FROM bookings b
LEFT JOIN payments p ON p.booking_id = b.id
LEFT JOIN rides r ON b.ride_id = r.id
WHERE b.status IN ('COMPLETED', 'DEBOARDED')
AND b.ride_ended_at IS NOT NULL
ORDER BY b.ride_ended_at DESC;

-- STEP 3: MANUAL FIX - Transfer locked to available
-- Replace {wallet_id} with the actual wallet ID from STEP 1
-- Replace {locked_amount} with the actual locked_balance from STEP 1

BEGIN;

-- Update wallet: move all locked balance to available
UPDATE hub_wallet 
SET 
    locked_balance = 0.00,
    available_balance = available_balance + locked_balance,
    updated_at = CURRENT_TIMESTAMP
WHERE id = {wallet_id};  -- REPLACE WITH ACTUAL WALLET ID

-- Create audit transactions for each completed booking
-- Get the wallet_id, booking_id, and payment info from STEP 2
-- Run this for EACH completed booking:

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
    {wallet_id},  -- REPLACE WITH ACTUAL WALLET ID
    b.id,
    p.id,
    'RELEASE',
    p.amount,
    (SELECT available_balance FROM hub_wallet WHERE id = {wallet_id}),
    CONCAT('Manual release - Ride completed - Booking #', b.id),
    CURRENT_TIMESTAMP
FROM bookings b
JOIN payments p ON p.booking_id = b.id
WHERE b.status IN ('COMPLETED', 'DEBOARDED')
AND b.ride_ended_at IS NOT NULL
AND NOT EXISTS (
    SELECT 1 FROM wallet_transactions wt 
    WHERE wt.booking_id = b.id 
    AND wt.type = 'RELEASE'
);

COMMIT;

-- STEP 4: Verify the fix
SELECT 
    u.name as driver_name,
    hw.locked_balance,
    hw.available_balance,
    hw.total_earnings
FROM hub_wallet hw
JOIN users u ON hw.driver_id = u.id
WHERE u.role = 'DRIVER';

-- Check transaction history
SELECT 
    wt.id,
    wt.type,
    wt.amount,
    wt.balance_after,
    wt.description,
    wt.created_at
FROM wallet_transactions wt
JOIN hub_wallet hw ON wt.wallet_id = hw.id
JOIN users u ON hw.driver_id = u.id
WHERE u.role = 'DRIVER'
ORDER BY wt.created_at DESC
LIMIT 20;
