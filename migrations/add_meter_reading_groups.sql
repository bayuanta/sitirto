-- Migration: Add Group-Based Meter Reading Support
-- Date: 2026-01-28
-- Description: Add meter_reading_group and route_order columns to customers table

-- Add new columns
ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS meter_reading_group VARCHAR(10) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS route_order INTEGER DEFAULT 0;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_customers_group_order 
ON customers(meter_reading_group, route_order);

-- Optional: Update existing customers to have default route_order based on name
-- This ensures alphabetical ordering for customers without explicit route order
UPDATE customers 
SET route_order = 0 
WHERE route_order IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN customers.meter_reading_group IS 'Meter reading group assignment (A, B, or NULL for unassigned)';
COMMENT ON COLUMN customers.route_order IS 'Custom route order within group (0 = default/alphabetical)';
