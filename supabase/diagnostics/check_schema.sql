-- Run this to check your current answers table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'answers'
ORDER BY ordinal_position;

-- Check notes table
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'notes'
ORDER BY ordinal_position;

-- Check action_items table
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'action_items'
ORDER BY ordinal_position;

-- Check one_on_ones table
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'one_on_ones'
ORDER BY ordinal_position;
