-- ============================================
-- RideHub Payment Flow Implementation
-- Database Migration Script
-- ============================================

-- 1. Add new columns to rides table for trip management
ALTER TABLE rides 
ADD COLUMN trip_status VARCHAR(50) DEFAULT 'SCHEDULED' AFTER status,
ADD COLUMN trip_started_at TIMESTAMP NULL AFTER trip_status,
ADD COLUMN trip_completed_at TIMESTAMP NULL AFTER trip_started_at;

-- Update existing rides to have SCHEDULED trip_status
UPDATE rides SET trip_status = 'SCHEDULED' WHERE trip_status IS NULL;

-- Make trip_status NOT NULL after default values are set
ALTER TABLE rides MODIFY COLUMN trip_status VARCHAR(50) NOT NULL DEFAULT 'SCHEDULED';

COMMENT ON COLUMN rides.trip_status IS 'Trip lifecycle status: SCHEDULED, PICKING_UP, IN_PROGRESS, COMPLETED, CANCELLED';

-- 2. Add new columns to bookings table for boarding/deboarding tracking
ALTER TABLE bookings 
ADD COLUMN onboarded_at TIMESTAMP NULL AFTER paid_at,
ADD COLUMN deboarded_at TIMESTAMP NULL AFTER onboarded_at;

-- Modify booking status enum to include new statuses
ALTER TABLE bookings MODIFY COLUMN status VARCHAR(50) NOT NULL;

COMMENT ON COLUMN bookings.onboarded_at IS 'Timestamp when passenger was onboarded (OTP validated)';
COMMENT ON COLUMN bookings.deboarded_at IS 'Timestamp when passenger was deboarded (OTP validated)';

-- 3. Create passenger_boarding_records table for OTP management
CREATE TABLE IF NOT EXISTS passenger_boarding_records (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    booking_id BIGINT NOT NULL,
    ride_id BIGINT NOT NULL,
    passenger_id BIGINT NOT NULL,
    otp_code VARCHAR(6) NOT NULL,
    otp_type VARCHAR(20) NOT NULL,
    generated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    validated_at TIMESTAMP NULL,
    is_validated BOOLEAN NOT NULL DEFAULT FALSE,
    expires_at TIMESTAMP NOT NULL,
    
    CONSTRAINT fk_pbr_booking FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
    CONSTRAINT fk_pbr_ride FOREIGN KEY (ride_id) REFERENCES rides(id) ON DELETE CASCADE,
    CONSTRAINT fk_pbr_passenger FOREIGN KEY (passenger_id) REFERENCES users(id) ON DELETE CASCADE,
    
    INDEX idx_pbr_booking (booking_id),
    INDEX idx_pbr_ride (ride_id),
    INDEX idx_pbr_otp (otp_code, otp_type, is_validated),
    INDEX idx_pbr_validated (is_validated),
    
    CONSTRAINT chk_pbr_otp_type CHECK (otp_type IN ('ONBOARDING', 'DEBOARDING'))
) COMMENT='Records of passenger boarding and deboarding OTP validations';

-- 4. Create driver_warnings table for penalty tracking
CREATE TABLE IF NOT EXISTS driver_warnings (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    driver_id BIGINT NOT NULL,
    ride_id BIGINT NULL,
    warning_type VARCHAR(50) NOT NULL,
    reason TEXT NULL,
    issued_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    resolved BOOLEAN NOT NULL DEFAULT FALSE,
    resolved_at TIMESTAMP NULL,
    
    CONSTRAINT fk_dw_driver FOREIGN KEY (driver_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_dw_ride FOREIGN KEY (ride_id) REFERENCES rides(id) ON DELETE SET NULL,
    
    INDEX idx_dw_driver (driver_id),
    INDEX idx_dw_resolved (resolved),
    INDEX idx_dw_type (warning_type),
    INDEX idx_dw_issued (issued_at),
    
    CONSTRAINT chk_dw_warning_type CHECK (warning_type IN (
        'LATE_CANCELLATION', 
        'LAST_MINUTE_CANCELLATION', 
        'NO_SHOW', 
        'PASSENGER_COMPLAINT', 
        'SAFETY_VIOLATION'
    ))
) COMMENT='Driver warning and penalty tracking';

-- 5. Add booking_id to otps table (optional - for enhanced OTP tracking)
-- This allows linking OTPs directly to bookings
ALTER TABLE otps 
ADD COLUMN booking_id BIGINT NULL AFTER email,
ADD CONSTRAINT fk_otp_booking FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE;

-- 6. Create indexes for performance optimization
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_paid_at ON bookings(paid_at);
CREATE INDEX idx_bookings_onboarded ON bookings(onboarded_at);
CREATE INDEX idx_rides_trip_status ON rides(trip_status);
CREATE INDEX idx_rides_trip_started ON rides(trip_started_at);
CREATE INDEX idx_payments_status ON payments(status);

-- 7. Create view for active trips (trips in progress)
CREATE OR REPLACE VIEW active_trips AS
SELECT 
    r.id as ride_id,
    r.driver_id,
    r.source,
    r.destination,
    r.ride_date,
    r.ride_time,
    r.trip_status,
    r.trip_started_at,
    COUNT(DISTINCT b.id) as total_passengers,
    COUNT(DISTINCT CASE WHEN b.status = 'ONBOARDED' THEN b.id END) as onboarded_passengers,
    COUNT(DISTINCT CASE WHEN b.status = 'DEBOARDED' THEN b.id END) as deboarded_passengers
FROM rides r
LEFT JOIN bookings b ON r.id = b.ride_id AND b.status IN ('CONFIRMED', 'ONBOARDED', 'DEBOARDED')
WHERE r.trip_status IN ('PICKING_UP', 'IN_PROGRESS')
GROUP BY r.id;

-- 8. Create view for driver warning summary
CREATE OR REPLACE VIEW driver_warning_summary AS
SELECT 
    u.id as driver_id,
    u.name as driver_name,
    u.email as driver_email,
    COUNT(dw.id) as total_warnings,
    COUNT(CASE WHEN dw.resolved = FALSE THEN 1 END) as unresolved_warnings,
    COUNT(CASE WHEN dw.warning_type = 'LATE_CANCELLATION' THEN 1 END) as late_cancellations,
    COUNT(CASE WHEN dw.warning_type = 'LAST_MINUTE_CANCELLATION' THEN 1 END) as last_minute_cancellations,
    COUNT(CASE WHEN dw.warning_type = 'NO_SHOW' THEN 1 END) as no_shows,
    MAX(dw.issued_at) as last_warning_date
FROM users u
LEFT JOIN driver_warnings dw ON u.id = dw.driver_id
WHERE u.role = 'DRIVER'
GROUP BY u.id;

-- 9. Create stored procedure for automatic fund unlocking
DELIMITER //

CREATE PROCEDURE unlock_funds_for_completed_booking(IN p_booking_id BIGINT)
BEGIN
    DECLARE v_driver_id BIGINT;
    DECLARE v_wallet_id BIGINT;
    DECLARE v_amount DECIMAL(10,2);
    DECLARE v_locked_balance DECIMAL(10,2);
    DECLARE v_available_balance DECIMAL(10,2);
    
    -- Get booking details
    SELECT b.driver_id, b.final_price
    INTO v_driver_id, v_amount
    FROM bookings b
    WHERE b.id = p_booking_id;
    
    -- Get wallet
    SELECT id, locked_balance, available_balance
    INTO v_wallet_id, v_locked_balance, v_available_balance
    FROM hub_wallet
    WHERE driver_id = v_driver_id;
    
    -- Transfer from locked to available
    UPDATE hub_wallet
    SET locked_balance = locked_balance - v_amount,
        available_balance = available_balance + v_amount
    WHERE id = v_wallet_id
    AND locked_balance >= v_amount;
    
    -- Log transaction
    INSERT INTO wallet_transactions (wallet_id, booking_id, type, amount, balance_after, description, created_at)
    VALUES (
        v_wallet_id,
        p_booking_id,
        'UNLOCK_TO_AVAILABLE',
        v_amount,
        v_available_balance + v_amount,
        CONCAT('Funds unlocked for completed ride - Booking #', p_booking_id),
        NOW()
    );
END //

DELIMITER ;

-- 10. Create trigger to update ride status when all passengers are deboarded
DELIMITER //

CREATE TRIGGER trg_check_all_deboarded
AFTER UPDATE ON bookings
FOR EACH ROW
BEGIN
    DECLARE v_total_bookings INT;
    DECLARE v_deboarded_count INT;
    
    IF NEW.status = 'DEBOARDED' THEN
        -- Count total active bookings for this ride
        SELECT COUNT(*) INTO v_total_bookings
        FROM bookings
        WHERE ride_id = NEW.ride_id
        AND status IN ('CONFIRMED', 'ONBOARDED', 'DEBOARDED');
        
        -- Count deboarded bookings
        SELECT COUNT(*) INTO v_deboarded_count
        FROM bookings
        WHERE ride_id = NEW.ride_id
        AND status = 'DEBOARDED';
        
        -- If all passengers deboarded, update ride status
        IF v_total_bookings = v_deboarded_count THEN
            UPDATE rides
            SET trip_status = 'COMPLETED',
                status = 'COMPLETED',
                trip_completed_at = NOW()
            WHERE id = NEW.ride_id;
        END IF;
    END IF;
END //

DELIMITER ;

-- 11. Insert sample data documentation (commented out - for reference only)
/*
-- Example: Generate onboarding OTP record
INSERT INTO passenger_boarding_records (booking_id, ride_id, passenger_id, otp_code, otp_type, expires_at)
VALUES (1, 1, 2, '123456', 'ONBOARDING', DATE_ADD(NOW(), INTERVAL 15 MINUTE));

-- Example: Issue driver warning
INSERT INTO driver_warnings (driver_id, ride_id, warning_type, reason)
VALUES (1, 1, 'LATE_CANCELLATION', 'Cancelled ride with 6 hours notice');
*/

-- 12. Grant necessary permissions (adjust as needed)
-- GRANT SELECT, INSERT, UPDATE ON passenger_boarding_records TO 'ridehub_app'@'localhost';
-- GRANT SELECT, INSERT ON driver_warnings TO 'ridehub_app'@'localhost';
-- GRANT EXECUTE ON PROCEDURE unlock_funds_for_completed_booking TO 'ridehub_app'@'localhost';

-- ============================================
-- Migration Complete
-- ============================================

-- Verification queries
SELECT 'Migration completed successfully. Run these queries to verify:' as Status;
SELECT 'SELECT * FROM rides WHERE trip_status IS NOT NULL LIMIT 5;' as Query1;
SELECT 'SELECT * FROM passenger_boarding_records LIMIT 5;' as Query2;
SELECT 'SELECT * FROM driver_warnings LIMIT 5;' as Query3;
SELECT 'SELECT * FROM active_trips;' as Query4;
SELECT 'SELECT * FROM driver_warning_summary;' as Query5;
