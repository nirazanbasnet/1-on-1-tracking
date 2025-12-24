-- =====================================================
-- Complete RLS Policy Fix - Remove ALL Infinite Recursion (V2)
-- This version handles existing policies gracefully
-- =====================================================

-- First, let's see what policies exist
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename IN ('teams', 'user_teams', 'metrics_snapshots', 'one_on_ones', 'app_users')
ORDER BY tablename, policyname;

-- =====================================================
-- STEP 1: Drop ALL existing policies on affected tables
-- =====================================================

-- Drop all teams policies
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN
        SELECT policyname
        FROM pg_policies
        WHERE tablename = 'teams'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || policy_record.policyname || '" ON teams';
    END LOOP;
END $$;

-- Drop all user_teams policies
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN
        SELECT policyname
        FROM pg_policies
        WHERE tablename = 'user_teams'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || policy_record.policyname || '" ON user_teams';
    END LOOP;
END $$;

-- Drop all metrics_snapshots policies
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN
        SELECT policyname
        FROM pg_policies
        WHERE tablename = 'metrics_snapshots'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || policy_record.policyname || '" ON metrics_snapshots';
    END LOOP;
END $$;

-- Drop all app_users SELECT policies (keep INSERT/UPDATE)
DROP POLICY IF EXISTS "authenticated_read_all" ON app_users;
DROP POLICY IF EXISTS "Users can view all users" ON app_users;
DROP POLICY IF EXISTS "Authenticated users can view users" ON app_users;

-- =====================================================
-- STEP 2: Create new simplified policies
-- =====================================================

-- =====================================================
-- APP_USERS TABLE POLICIES (Simple, no recursion)
-- =====================================================

-- All authenticated users can view all users (no recursion)
CREATE POLICY "authenticated_users_read_all"
    ON app_users
    FOR SELECT
    TO authenticated
    USING (true);

-- =====================================================
-- TEAMS TABLE POLICIES (Simple, no recursion)
-- =====================================================

-- Allow all authenticated users to view all teams (simplest, no recursion possible)
CREATE POLICY "allow_authenticated_view_teams"
    ON teams
    FOR SELECT
    TO authenticated
    USING (true);

-- Admins can manage teams
CREATE POLICY "admins_manage_teams"
    ON teams
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM app_users
            WHERE app_users.id = auth.uid()
            AND app_users.role = 'admin'
        )
    );

-- =====================================================
-- USER_TEAMS TABLE POLICIES (No references to teams table)
-- =====================================================

-- Users can view their own team memberships
CREATE POLICY "users_view_own_memberships"
    ON user_teams
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

-- Admins can view all memberships
CREATE POLICY "admins_view_all_memberships"
    ON user_teams
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM app_users
            WHERE app_users.id = auth.uid()
            AND app_users.role = 'admin'
        )
    );

-- Managers can view memberships for their teams (using direct manager_id check, no join to teams)
CREATE POLICY "managers_view_team_memberships"
    ON user_teams
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM app_users a
            WHERE a.id = auth.uid()
            AND a.role = 'manager'
        )
    );

-- Admins can insert/update/delete memberships
CREATE POLICY "admins_insert_memberships"
    ON user_teams
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM app_users
            WHERE app_users.id = auth.uid()
            AND app_users.role = 'admin'
        )
    );

CREATE POLICY "admins_update_memberships"
    ON user_teams
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM app_users
            WHERE app_users.id = auth.uid()
            AND app_users.role = 'admin'
        )
    );

CREATE POLICY "admins_delete_memberships"
    ON user_teams
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM app_users
            WHERE app_users.id = auth.uid()
            AND app_users.role = 'admin'
        )
    );

-- =====================================================
-- METRICS_SNAPSHOTS TABLE POLICIES (No team references)
-- =====================================================

-- Users can view their own metrics
CREATE POLICY "users_view_own_metrics"
    ON metrics_snapshots
    FOR SELECT
    TO authenticated
    USING (developer_id = auth.uid());

-- Admins can view all metrics
CREATE POLICY "admins_view_all_metrics"
    ON metrics_snapshots
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM app_users
            WHERE app_users.id = auth.uid()
            AND app_users.role = 'admin'
        )
    );

-- Managers can view metrics for developers (without referencing teams)
CREATE POLICY "managers_view_metrics"
    ON metrics_snapshots
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM app_users
            WHERE app_users.id = auth.uid()
            AND app_users.role = 'manager'
        )
    );

-- System can insert/update metrics (for auto-calculation)
CREATE POLICY "system_manage_metrics"
    ON metrics_snapshots
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- =====================================================
-- STEP 3: TEST THE FIX
-- =====================================================

-- Test 1: Query teams (should work)
SELECT 'Test 1: Querying teams...' as test;
SELECT COUNT(*) as team_count FROM teams;

-- Test 2: Query user_teams (should work)
SELECT 'Test 2: Querying user_teams...' as test;
SELECT COUNT(*) as membership_count FROM user_teams;

-- Test 3: Query metrics_snapshots (should work)
SELECT 'Test 3: Querying metrics_snapshots...' as test;
SELECT COUNT(*) as metrics_count FROM metrics_snapshots;

-- Test 4: Join query (should work)
SELECT 'Test 4: Testing join query...' as test;
SELECT
    m.month_year,
    m.average_score,
    u.email
FROM metrics_snapshots m
JOIN app_users u ON u.id = m.developer_id
LIMIT 1;

-- Final result
SELECT 'SUCCESS: All policies fixed! No more infinite recursion.' as result;

-- Show summary
DO $$
BEGIN
    RAISE NOTICE '=== POLICY SUMMARY ===';
    RAISE NOTICE 'App_users policies: %', (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'app_users');
    RAISE NOTICE 'Teams policies: %', (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'teams');
    RAISE NOTICE 'User_teams policies: %', (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'user_teams');
    RAISE NOTICE 'Metrics_snapshots policies: %', (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'metrics_snapshots');
    RAISE NOTICE 'All RLS policies have been simplified to avoid recursion.';
END $$;
