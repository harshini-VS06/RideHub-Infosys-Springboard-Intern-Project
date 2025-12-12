-- Fix for missing columns in bookings table
-- Run this script in your PostgreSQL database

-- Add missing columns to bookings table
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS initial_email_sent BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS payment_request_sent BOOLEAN NOT NULL DEFAULT false;

-- Verify the columns were added
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'bookings'
  AND column_name IN ('initial_email_sent', 'payment_request_sent');

-- Optional: Update existing records if needed
-- UPDATE bookings SET initial_email_sent = false WHERE initial_email_sent IS NULL;
-- UPDATE bookings SET payment_request_sent = false WHERE payment_request_sent IS NULL;
