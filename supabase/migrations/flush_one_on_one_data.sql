-- ⚠️ FLUSH ONE-ON-ONE DATA - This will DELETE all 1-on-1 sessions, answers, notes, and action items
-- This script preserves: users, teams, questions, and notifications
-- Run this in Supabase SQL Editor to start fresh

-- Disable foreign key checks temporarily
SET session_replication_role = 'replica';

-- Delete all action items first (has FK to one_on_ones)
TRUNCATE TABLE action_items CASCADE;

-- Delete all notes (has FK to one_on_ones)
TRUNCATE TABLE notes CASCADE;

-- Delete all answers (has FK to one_on_ones)
TRUNCATE TABLE answers CASCADE;

-- Delete all metrics snapshots (has FK to one_on_ones)
TRUNCATE TABLE metrics_snapshots CASCADE;

-- Delete all notifications related to one-on-ones
DELETE FROM notifications
WHERE notification_type IN (
  'one_on_one_submitted',
  'one_on_one_reviewed',
  'one_on_one_completed',
  'one_on_one_reminder'
);

-- Finally, delete all one_on_ones
TRUNCATE TABLE one_on_ones CASCADE;

-- Re-enable foreign key checks
SET session_replication_role = 'origin';

-- Show summary
SELECT
  'Data flushed successfully!' as status,
  (SELECT COUNT(*) FROM one_on_ones) as remaining_one_on_ones,
  (SELECT COUNT(*) FROM answers) as remaining_answers,
  (SELECT COUNT(*) FROM notes) as remaining_notes,
  (SELECT COUNT(*) FROM action_items) as remaining_action_items,
  (SELECT COUNT(*) FROM metrics_snapshots) as remaining_metrics;
