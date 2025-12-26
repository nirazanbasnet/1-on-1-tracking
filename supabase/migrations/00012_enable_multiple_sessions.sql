-- Enable multiple 1-on-1 sessions per month for same developer/manager pair

-- Remove unique constraint that prevents multiple sessions
-- Try both possible constraint names (one might exist depending on how table was created)
ALTER TABLE one_on_ones DROP CONSTRAINT IF EXISTS one_on_ones_developer_id_manager_id_month_year_key;
ALTER TABLE one_on_ones DROP CONSTRAINT IF EXISTS one_on_ones_developer_id_month_year_key;

-- Add session_number to track multiple sessions in same month
ALTER TABLE one_on_ones ADD COLUMN IF NOT EXISTS session_number INTEGER DEFAULT 1;

-- Add title for session identification
ALTER TABLE one_on_ones ADD COLUMN IF NOT EXISTS title TEXT;

-- Create composite index for efficient querying
CREATE INDEX IF NOT EXISTS idx_one_on_ones_developer_month_session
ON one_on_ones(developer_id, month_year, session_number);

-- Update existing records to have session_number = 1
UPDATE one_on_ones
SET session_number = 1
WHERE session_number IS NULL;

-- Make session_number NOT NULL after setting defaults
ALTER TABLE one_on_ones ALTER COLUMN session_number SET NOT NULL;

-- Add constraint to ensure session numbers are positive
ALTER TABLE one_on_ones ADD CONSTRAINT check_session_number_positive
CHECK (session_number > 0);

-- Update title for existing sessions
UPDATE one_on_ones
SET title = 'Session 1'
WHERE title IS NULL AND session_number = 1;

-- Add helpful comments
COMMENT ON COLUMN one_on_ones.session_number IS 'Session number for this month (1, 2, 3, etc.)';
COMMENT ON COLUMN one_on_ones.title IS 'Optional title for the session (e.g., "Mid-Sprint Check-in")';
