-- ============================================
-- AUTOMATIC WALLET FIX - Run this entire script
-- ============================================
-- This will automatically fix ALL locked balances

DO $$
DECLARE
    v_wallet_id BIGINT;
    v_driver_id BIGINT;
    v_locked_amount NUMERIC;
    v_booking RECORD;
BEGIN
    -- Loop through all driver wallets with locked balance
    FOR v_wallet_id, v_driver_id, v_locked_amount IN 
        SELECT hw.id, hw.driver_id, hw.locked_balance
        FROM hub_wallet hw
        WHERE hw.locked_balance > 0
    LOOP
        RAISE NOTICE 'Processing wallet ID: %, Locked Balance: %', v_wallet_id, v_locked_amount;
        
        -- Transfer locked to available
        UPDATE hub_wallet 
        SET 
            locked_balance = 0.00,
            available_balance = available_balance + v_locked_amount,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = v_wallet_id;
        
        RAISE NOTICE '✓ Transferred % to available balance', v_locked_amount;
        
        -- Create release transactions for each completed booking
        FOR v_booking IN 
            SELECT b.id as booking_id, p.id as payment_id, p.amount
            FROM bookings b
            JOIN payments p ON p.booking_id = b.id
            JOIN rides r ON b.ride_id = r.id
            WHERE r.driver_id = v_driver_id
            AND b.status IN ('COMPLETED', 'DEBOARDED')
            AND b.ride_ended_at IS NOT NULL
            AND NOT EXISTS (
                SELECT 1 FROM wallet_transactions wt 
                WHERE wt.booking_id = b.id 
                AND wt.type = 'UNLOCK_TO_AVAILABLE'
            )
        LOOP
            INSERT INTO wallet_transactions (
                wallet_id,
                booking_id, 
                payment_id,
                type,
                amount,
                balance_after,
                description,
                created_at
            ) VALUES (
                v_wallet_id,
                v_booking.booking_id,
                v_booking.payment_id,
                'UNLOCK_TO_AVAILABLE',
                v_booking.amount,
                (SELECT available_balance FROM hub_wallet WHERE id = v_wallet_id),
                'Funds unlocked for completed ride - Booking #' || v_booking.booking_id,
                CURRENT_TIMESTAMP
            );
            
            RAISE NOTICE '✓ Created UNLOCK_TO_AVAILABLE transaction for booking #%', v_booking.booking_id;
        END LOOP;
        
    END LOOP;
    
    RAISE NOTICE '=== WALLET FIX COMPLETED ===';
END $$;

-- Verify results
SELECT 
    u.name as driver_name,
    u.email,
    hw.locked_balance,
    hw.available_balance,
    hw.total_earnings
FROM hub_wallet hw
JOIN users u ON hw.driver_id = u.id
WHERE u.role = 'DRIVER';

-- Show recent transactions
SELECT 
    u.name as driver_name,
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
