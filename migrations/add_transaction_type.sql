-- Add 'type' column to transactions table for categorizing expenses/incomes
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'bill_payment';

-- Optional: Update existing records if needed (already handled by default)
-- UPDATE transactions SET type = 'bill_payment' WHERE type IS NULL;
