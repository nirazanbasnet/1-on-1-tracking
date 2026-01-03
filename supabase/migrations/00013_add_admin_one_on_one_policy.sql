-- =====================================================
-- Add Admin Policies for All One-on-One Related Tables
-- Allows admins to view all data for analytics and management
-- =====================================================

-- Helper function to check if user is admin (reusable in policies)
CREATE OR REPLACE FUNCTION is_user_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM app_users
        WHERE app_users.id = auth.uid()
        AND app_users.role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing admin policies if they exist (to allow re-running migration)
DROP POLICY IF EXISTS "admins_can_view_all_one_on_ones" ON one_on_ones;
DROP POLICY IF EXISTS "admins_can_view_all_metrics" ON metrics_snapshots;
DROP POLICY IF EXISTS "admins_can_view_all_answers" ON answers;
DROP POLICY IF EXISTS "admins_can_view_all_notes" ON notes;
DROP POLICY IF EXISTS "admins_can_view_all_action_items" ON action_items;
DROP POLICY IF EXISTS "admins_can_view_all_questions" ON questions;
DROP POLICY IF EXISTS "admins_can_view_all_teams" ON teams;
DROP POLICY IF EXISTS "admins_can_view_all_user_teams" ON user_teams;

-- Admin policy for viewing all one-on-ones
CREATE POLICY "admins_can_view_all_one_on_ones"
    ON one_on_ones FOR SELECT
    TO authenticated
    USING (is_user_admin());

-- Admin policy for viewing all metrics
CREATE POLICY "admins_can_view_all_metrics"
    ON metrics_snapshots FOR SELECT
    TO authenticated
    USING (is_user_admin());

-- Admin policy for viewing all answers (form data)
CREATE POLICY "admins_can_view_all_answers"
    ON answers FOR SELECT
    TO authenticated
    USING (is_user_admin());

-- Admin policy for viewing all notes
CREATE POLICY "admins_can_view_all_notes"
    ON notes FOR SELECT
    TO authenticated
    USING (is_user_admin());

-- Admin policy for viewing all action items
CREATE POLICY "admins_can_view_all_action_items"
    ON action_items FOR SELECT
    TO authenticated
    USING (is_user_admin());

-- Admin policy for viewing all questions (including team-specific)
CREATE POLICY "admins_can_view_all_questions"
    ON questions FOR SELECT
    TO authenticated
    USING (is_user_admin());

-- Admin policy for viewing all teams
CREATE POLICY "admins_can_view_all_teams"
    ON teams FOR SELECT
    TO authenticated
    USING (is_user_admin());

-- Admin policy for viewing all user-team relationships
CREATE POLICY "admins_can_view_all_user_teams"
    ON user_teams FOR SELECT
    TO authenticated
    USING (is_user_admin());
