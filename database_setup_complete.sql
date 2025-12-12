-- ============================================================================
-- RideHub Database Setup and Verification Script
-- ============================================================================
-- This script checks for missing tables and creates them if needed
-- Run this in PostgreSQL (pgAdmin or psql) for database: ridehub_db
-- ============================================================================

-- Check current database
SELECT current_database() as "Current Database";

-- ============================================================================
-- 1. USERS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    contact VARCHAR(20),
    age INTEGER,
    gender VARCHAR(20),
    role VARCHAR(50) NOT NULL,
    car_model VARCHAR(255),
    license_plate VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- ============================================================================
-- 2. RIDES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS rides (
    id BIGSERIAL PRIMARY KEY,
    driver_id BIGINT NOT NULL,
    source VARCHAR(255) NOT NULL,
    destination VARCHAR(255) NOT NULL,
    ride_date DATE NOT NULL,
    ride_time TIME NOT NULL,
    total_seats INTEGER NOT NULL,
    available_seats INTEGER NOT NULL,
    fare_per_km DECIMAL(10,2) NOT NULL,
    distance DECIMAL(10,2),
    source_lat DOUBLE PRECISION,
    source_lng DOUBLE PRECISION,
    dest_lat DOUBLE PRECISION,
    dest_lng DOUBLE PRECISION,
    status VARCHAR(50) NOT NULL DEFAULT 'AVAILABLE',
    trip_status VARCHAR(50) DEFAULT 'SCHEDULED',
    trip_started_at TIMESTAMP,
    trip_completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_ride_driver FOREIGN KEY (driver_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_rides_driver_id ON rides(driver_id);
CREATE INDEX IF NOT EXISTS idx_rides_ride_date ON rides(ride_date);
CREATE INDEX IF NOT EXISTS idx_rides_status ON rides(status);
CREATE INDEX IF NOT EXISTS idx_rides_source ON rides(source);
CREATE INDEX IF NOT EXISTS idx_rides_destination ON rides(destination);

-- ============================================================================
-- 3. BOOKINGS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS bookings (
    id BIGSERIAL PRIMARY KEY,
    ride_id BIGINT NOT NULL,
    passenger_id BIGINT NOT NULL,
    seats_booked INTEGER NOT NULL,
    pickup_location VARCHAR(255) NOT NULL,
    drop_location VARCHAR(255) NOT NULL,
    pickup_lat DOUBLE PRECISION,
    pickup_lng DOUBLE PRECISION,
    drop_lat DOUBLE PRECISION,
    drop_lng DOUBLE PRECISION,
    total_fare DECIMAL(10,2) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    booked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    confirmed_at TIMESTAMP,
    paid_at TIMESTAMP,
    cancelled_at TIMESTAMP,
    driver_started_ride BOOLEAN DEFAULT FALSE,
    passenger_started_ride BOOLEAN DEFAULT FALSE,
    ride_started_at TIMESTAMP,
    ride_ended_at TIMESTAMP,
    deboarded_at TIMESTAMP,
    
    CONSTRAINT fk_booking_ride FOREIGN KEY (ride_id) REFERENCES rides(id) ON DELETE CASCADE,
    CONSTRAINT fk_booking_passenger FOREIGN KEY (passenger_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_bookings_ride_id ON bookings(ride_id);
CREATE INDEX IF NOT EXISTS idx_bookings_passenger_id ON bookings(passenger_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);

-- ============================================================================
-- 4. REVIEWS TABLE (THE MISSING ONE!)
-- ============================================================================
CREATE TABLE IF NOT EXISTS reviews (
    id BIGSERIAL PRIMARY KEY,
    booking_id BIGINT NOT NULL UNIQUE,
    ride_id BIGINT NOT NULL,
    driver_id BIGINT NOT NULL,
    passenger_id BIGINT NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment VARCHAR(1000),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_review_booking FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
    CONSTRAINT fk_review_ride FOREIGN KEY (ride_id) REFERENCES rides(id) ON DELETE CASCADE,
    CONSTRAINT fk_review_driver FOREIGN KEY (driver_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_review_passenger FOREIGN KEY (passenger_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_reviews_driver_id ON reviews(driver_id);
CREATE INDEX IF NOT EXISTS idx_reviews_passenger_id ON reviews(passenger_id);
CREATE INDEX IF NOT EXISTS idx_reviews_ride_id ON reviews(ride_id);
CREATE INDEX IF NOT EXISTS idx_reviews_booking_id ON reviews(booking_id);

-- ============================================================================
-- 5. PAYMENTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS payments (
    id BIGSERIAL PRIMARY KEY,
    booking_id BIGINT NOT NULL,
    passenger_id BIGINT NOT NULL,
    driver_id BIGINT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    razorpay_order_id VARCHAR(255),
    razorpay_payment_id VARCHAR(255),
    razorpay_signature VARCHAR(512),
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    payment_method VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_payment_booking FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
    CONSTRAINT fk_payment_passenger FOREIGN KEY (passenger_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_payment_driver FOREIGN KEY (driver_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_payments_booking_id ON payments(booking_id);
CREATE INDEX IF NOT EXISTS idx_payments_passenger_id ON payments(passenger_id);
CREATE INDEX IF NOT EXISTS idx_payments_driver_id ON payments(driver_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);

-- ============================================================================
-- 6. HUB_WALLET TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS hub_wallet (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE,
    locked_balance DECIMAL(10,2) DEFAULT 0.00,
    available_balance DECIMAL(10,2) DEFAULT 0.00,
    total_earnings DECIMAL(10,2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_wallet_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_hub_wallet_user_id ON hub_wallet(user_id);

-- ============================================================================
-- 7. WALLET_TRANSACTIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS wallet_transactions (
    id BIGSERIAL PRIMARY KEY,
    wallet_id BIGINT NOT NULL,
    booking_id BIGINT,
    amount DECIMAL(10,2) NOT NULL,
    transaction_type VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL,
    description VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_transaction_wallet FOREIGN KEY (wallet_id) REFERENCES hub_wallet(id) ON DELETE CASCADE,
    CONSTRAINT fk_transaction_booking FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_wallet_transactions_wallet_id ON wallet_transactions(wallet_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_booking_id ON wallet_transactions(booking_id);

-- ============================================================================
-- 8. OTP TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS otp (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    otp_code VARCHAR(10) NOT NULL,
    purpose VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    verified BOOLEAN DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_otp_email ON otp(email);
CREATE INDEX IF NOT EXISTS idx_otp_expires_at ON otp(expires_at);

-- ============================================================================
-- 9. DRIVER_WARNINGS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS driver_warnings (
    id BIGSERIAL PRIMARY KEY,
    driver_id BIGINT NOT NULL,
    warning_type VARCHAR(100) NOT NULL,
    description VARCHAR(500),
    severity VARCHAR(50),
    issued_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved BOOLEAN DEFAULT FALSE,
    resolved_at TIMESTAMP,
    
    CONSTRAINT fk_warning_driver FOREIGN KEY (driver_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_driver_warnings_driver_id ON driver_warnings(driver_id);

-- ============================================================================
-- 10. PASSENGER_BOARDING_RECORDS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS passenger_boarding_records (
    id BIGSERIAL PRIMARY KEY,
    booking_id BIGINT NOT NULL,
    ride_id BIGINT NOT NULL,
    passenger_id BIGINT NOT NULL,
    boarded_at TIMESTAMP,
    deboarded_at TIMESTAMP,
    boarding_status VARCHAR(50),
    
    CONSTRAINT fk_boarding_booking FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
    CONSTRAINT fk_boarding_ride FOREIGN KEY (ride_id) REFERENCES rides(id) ON DELETE CASCADE,
    CONSTRAINT fk_boarding_passenger FOREIGN KEY (passenger_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_boarding_booking_id ON passenger_boarding_records(booking_id);
CREATE INDEX IF NOT EXISTS idx_boarding_ride_id ON passenger_boarding_records(ride_id);

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check all tables exist
SELECT 
    table_name,
    CASE 
        WHEN table_name IN (
            'users', 'rides', 'bookings', 'reviews', 'payments', 
            'hub_wallet', 'wallet_transactions', 'otp', 
            'driver_warnings', 'passenger_boarding_records'
        ) THEN '✓ EXISTS'
        ELSE '✗ MISSING'
    END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
  AND table_name IN (
      'users', 'rides', 'bookings', 'reviews', 'payments', 
      'hub_wallet', 'wallet_transactions', 'otp', 
      'driver_warnings', 'passenger_boarding_records'
  )
ORDER BY table_name;

-- Count records in each table
SELECT 'users' as table_name, COUNT(*) as record_count FROM users
UNION ALL
SELECT 'rides', COUNT(*) FROM rides
UNION ALL
SELECT 'bookings', COUNT(*) FROM bookings
UNION ALL
SELECT 'reviews', COUNT(*) FROM reviews
UNION ALL
SELECT 'payments', COUNT(*) FROM payments
UNION ALL
SELECT 'hub_wallet', COUNT(*) FROM hub_wallet
UNION ALL
SELECT 'wallet_transactions', COUNT(*) FROM wallet_transactions
UNION ALL
SELECT 'otp', COUNT(*) FROM otp
UNION ALL
SELECT 'driver_warnings', COUNT(*) FROM driver_warnings
UNION ALL
SELECT 'passenger_boarding_records', COUNT(*) FROM passenger_boarding_records
ORDER BY table_name;

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================
SELECT '
============================================================================
DATABASE SETUP COMPLETE!
============================================================================
All required tables have been created successfully.
You can now restart your Spring Boot application.

Next steps:
1. Restart the backend server
2. Test the driver dashboard
3. Verify reviews endpoints work

If you still face issues, check:
- Database connection in application.properties
- Hibernate DDL auto setting
- Application logs for other errors
============================================================================
' as "Setup Complete";
