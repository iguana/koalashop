-- Migration script to add units column to existing products table
-- Run this if you have an existing database without the units column

-- Add units column to products table
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS units VARCHAR(10) NOT NULL DEFAULT 'oz';

-- Add check constraint for valid units
ALTER TABLE products 
ADD CONSTRAINT IF NOT EXISTS check_units 
CHECK (units IN ('oz', 'each', 'lbs', 'grams'));

-- Update existing products to have 'oz' as default (if they don't already)
UPDATE products 
SET units = 'oz' 
WHERE units IS NULL OR units = '';

-- Verify the migration
SELECT 
  id, 
  name, 
  unit_price, 
  units, 
  created_at 
FROM products 
LIMIT 5;
