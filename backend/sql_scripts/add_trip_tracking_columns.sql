-- Add missing trip tracking columns to rides table
-- Run this script to fix the database schema

-- Add trip_started_at column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'rides' AND column_name = 'trip_started_at'
    ) THEN
        ALTER TABLE rides ADD COLUMN trip_started_at TIMESTAMP;
    END IF;
END $$;

-- Add trip_completed_at column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'rides' AND column_name = 'trip_completed_at'
    ) THEN
        ALTER TABLE rides ADD COLUMN trip_completed_at TIMESTAMP;
    END IF;
END $$;

-- Add trip_status column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'rides' AND column_name = 'trip_status'
    ) THEN
        ALTER TABLE rides ADD COLUMN trip_status VARCHAR(20) NOT NULL DEFAULT 'SCHEDULED';
    END IF;
END $$;

-- Add CHECK constraint for trip_status
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.constraint_column_usage 
        WHERE table_name = 'rides' AND constraint_name = 'rides_trip_status_check'
    ) THEN
        ALTER TABLE rides ADD CONSTRAINT rides_trip_status_check 
        CHECK (trip_status IN ('SCHEDULED', 'PICKING_UP', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'));
    END IF;
END $$;

-- Verify the columns were added
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'rides' 
AND column_name IN ('trip_started_at', 'trip_completed_at', 'trip_status')
ORDER BY column_name;
