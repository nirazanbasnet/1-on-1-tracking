-- =====================================================
-- Seed Data for Development and Testing
-- =====================================================

-- NOTE: This creates sample data. In production, you'll want to:
-- 1. Remove this file or run it selectively
-- 2. Users will be created automatically when they first log in
-- 3. Admins should manually create teams and questions

-- =====================================================
-- TEAMS
-- =====================================================

INSERT INTO teams (id, name) VALUES
    ('11111111-1111-1111-1111-111111111111', 'Engineering - Frontend'),
    ('22222222-2222-2222-2222-222222222222', 'Engineering - Backend'),
    ('33333333-3333-3333-3333-333333333333', 'Engineering - DevOps')
ON CONFLICT (name) DO NOTHING;

-- =====================================================
-- COMPANY-WIDE QUESTIONS
-- =====================================================

INSERT INTO questions (question_text, question_type, scope, sort_order) VALUES
    ('How satisfied are you with your current work-life balance?', 'rating_1_5', 'company', 1),
    ('How would you rate your productivity this month?', 'rating_1_5', 'company', 2),
    ('How clear are you on your current goals and objectives?', 'rating_1_5', 'company', 3),
    ('How supported do you feel by your team and manager?', 'rating_1_5', 'company', 4),
    ('Are you satisfied with your professional growth opportunities?', 'rating_1_5', 'company', 5),
    ('What were your main achievements this month?', 'text', 'company', 6),
    ('What challenges did you face this month?', 'text', 'company', 7),
    ('What are your goals for next month?', 'text', 'company', 8),
    ('Do you have any blockers that need to be addressed?', 'text', 'company', 9),
    ('Is there anything else you would like to discuss?', 'text', 'company', 10)
ON CONFLICT DO NOTHING;

-- =====================================================
-- NOTES
-- =====================================================

-- Add helpful note for the migration
COMMENT ON TABLE app_users IS 'Extended user profiles synced from auth.users. New users are automatically created via database trigger.';
COMMENT ON TABLE one_on_ones IS 'Monthly 1-on-1 sessions. One record per developer per month.';
COMMENT ON TABLE questions IS 'Question bank for 1-on-1s. Can be company-wide or team-specific.';
COMMENT ON TABLE answers IS 'Responses to questions. Separate answers for developer and manager perspectives.';
COMMENT ON TABLE notes IS 'Free-form notes - developer reflections and manager feedback.';
COMMENT ON TABLE action_items IS 'Follow-up tasks assigned during 1-on-1s.';
COMMENT ON TABLE metrics_snapshots IS 'Calculated monthly metrics for tracking growth over time.';
