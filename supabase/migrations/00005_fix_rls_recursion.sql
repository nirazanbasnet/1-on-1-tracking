-- =====================================================
-- Fix RLS Infinite Recursion Issue
-- =====================================================
-- The problem: policies that call is_admin(), is_manager(), etc.
-- cause infinite recursion because those functions query app_users

-- =====================================================
-- Step 1: Drop ALL policies that use helper functions
-- =====================================================

-- Drop policies on app_users
DROP POLICY IF EXISTS "Users can view own profile" ON app_users;
DROP POLICY IF EXISTS "Users can update own profile" ON app_users;
DROP POLICY IF EXISTS "Managers can view team members" ON app_users;
DROP POLICY IF EXISTS "Admins have full access to users" ON app_users;
DROP POLICY IF EXISTS "users_select_own" ON app_users;
DROP POLICY IF EXISTS "users_update_own" ON app_users;
DROP POLICY IF EXISTS "users_select_team" ON app_users;
DROP POLICY IF EXISTS "users_all_for_service_role" ON app_users;

-- Drop policies on teams that use is_admin()
DROP POLICY IF EXISTS "Admins have full access to teams" ON teams;
DROP POLICY IF EXISTS "Managers can view their team" ON teams;

-- Drop policies on one_on_ones that use is_admin()
DROP POLICY IF EXISTS "Admins have full access to 1-on-1s" ON one_on_ones;

-- Drop policies on questions that use is_admin()
DROP POLICY IF EXISTS "Admins can manage company questions" ON questions;

-- Drop policies on answers that use is_admin()
DROP POLICY IF EXISTS "Admins have full access to answers" ON answers;

-- Drop policies on notes that use is_admin()
DROP POLICY IF EXISTS "Admins have full access to notes" ON notes;

-- Drop policies on action_items that use is_admin()
DROP POLICY IF EXISTS "Admins have full access to action items" ON action_items;

-- Drop policies on metrics_snapshots that use is_admin()
DROP POLICY IF EXISTS "Admins can manage metrics" ON metrics_snapshots;

-- =====================================================
-- Step 2: Create simple policies without recursion
-- =====================================================

-- APP_USERS: All authenticated users can read all profiles
-- (We'll handle access control in the application layer)
CREATE POLICY "authenticated_read_all"
    ON app_users FOR SELECT
    TO authenticated
    USING (true);

-- APP_USERS: Users can update their own profile
CREATE POLICY "authenticated_update_own"
    ON app_users FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- TEAMS: All authenticated users can view teams
CREATE POLICY "authenticated_read_teams"
    ON teams FOR SELECT
    TO authenticated
    USING (true);

-- ONE_ON_ONES: Users can view their own 1-on-1s
CREATE POLICY "view_own_one_on_ones"
    ON one_on_ones FOR SELECT
    TO authenticated
    USING (developer_id = auth.uid() OR manager_id = auth.uid());

-- QUESTIONS: All authenticated users can view active questions
CREATE POLICY "view_active_questions"
    ON questions FOR SELECT
    TO authenticated
    USING (is_active = true);

-- ANSWERS: Users can view answers for their 1-on-1s
CREATE POLICY "view_own_answers"
    ON answers FOR SELECT
    TO authenticated
    USING (
        one_on_one_id IN (
            SELECT id FROM one_on_ones
            WHERE developer_id = auth.uid() OR manager_id = auth.uid()
        )
    );

-- NOTES: Users can view notes for their 1-on-1s
CREATE POLICY "view_own_notes"
    ON notes FOR SELECT
    TO authenticated
    USING (
        one_on_one_id IN (
            SELECT id FROM one_on_ones
            WHERE developer_id = auth.uid() OR manager_id = auth.uid()
        )
    );

-- ACTION_ITEMS: Users can view action items for their 1-on-1s
CREATE POLICY "view_own_action_items"
    ON action_items FOR SELECT
    TO authenticated
    USING (
        one_on_one_id IN (
            SELECT id FROM one_on_ones
            WHERE developer_id = auth.uid() OR manager_id = auth.uid()
        )
    );

-- METRICS: Users can view metrics for their 1-on-1s
CREATE POLICY "view_own_metrics"
    ON metrics_snapshots FOR SELECT
    TO authenticated
    USING (developer_id = auth.uid());
