-- =====================================================
-- Verify Fresh Install - Run After All Migrations
-- =====================================================
-- This script checks that everything is properly set up
-- Run this after completing FRESH_START_GUIDE.md

-- =====================================================
-- 1. CHECK TABLES EXIST
-- =====================================================

SELECT 'Step 1: Checking tables exist...' as step;

DO $$
DECLARE
    expected_tables TEXT[] := ARRAY[
        'app_users',
        'teams',
        'user_teams',
        'questions',
        'one_on_ones',
        'answers',
        'metrics_snapshots',
        'notifications'
    ];
    actual_count INT;
    missing_tables TEXT;
BEGIN
    -- Count how many expected tables exist
    SELECT COUNT(*)
    INTO actual_count
    FROM pg_tables
    WHERE schemaname = 'public'
    AND tablename = ANY(expected_tables);

    -- Find missing tables
    SELECT STRING_AGG(t, ', ')
    INTO missing_tables
    FROM UNNEST(expected_tables) t
    WHERE NOT EXISTS (
        SELECT 1 FROM pg_tables
        WHERE schemaname = 'public' AND tablename = t
    );

    RAISE NOTICE 'Tables found: %/% expected', actual_count, array_length(expected_tables, 1);

    IF actual_count = array_length(expected_tables, 1) THEN
        RAISE NOTICE '✓ All tables exist';
    ELSE
        RAISE NOTICE '✗ Missing tables: %', missing_tables;
    END IF;
END $$;

-- =====================================================
-- 2. CHECK CUSTOM TYPES EXIST
-- =====================================================

SELECT 'Step 2: Checking custom types...' as step;

DO $$
DECLARE
    expected_types TEXT[] := ARRAY[
        'user_role',
        'question_type',
        'question_scope',
        'one_on_one_status',
        'answer_type'
    ];
    actual_count INT;
BEGIN
    SELECT COUNT(*)
    INTO actual_count
    FROM pg_type
    WHERE typname = ANY(expected_types);

    RAISE NOTICE 'Custom types found: %/%', actual_count, array_length(expected_types, 1);

    IF actual_count = array_length(expected_types, 1) THEN
        RAISE NOTICE '✓ All custom types exist';
    ELSE
        RAISE NOTICE '✗ Some types missing - check migration 00001';
    END IF;
END $$;

-- =====================================================
-- 3. CHECK RLS IS ENABLED
-- =====================================================

SELECT 'Step 3: Checking RLS is enabled...' as step;

SELECT
    tablename,
    CASE WHEN rowsecurity THEN '✓ Enabled' ELSE '✗ DISABLED' END as rls_status
FROM pg_tables t
JOIN pg_class c ON c.relname = t.tablename
WHERE t.schemaname = 'public'
AND t.tablename IN ('app_users', 'teams', 'user_teams', 'questions', 'one_on_ones', 'answers', 'metrics_snapshots')
ORDER BY tablename;

-- =====================================================
-- 4. CHECK RLS POLICIES EXIST
-- =====================================================

SELECT 'Step 4: Checking RLS policies...' as step;

SELECT
    tablename,
    COUNT(*) as policy_count,
    CASE
        WHEN COUNT(*) > 0 THEN '✓ Has policies'
        ELSE '✗ NO POLICIES'
    END as status
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('app_users', 'teams', 'user_teams', 'questions', 'one_on_ones', 'answers', 'metrics_snapshots')
GROUP BY tablename
ORDER BY tablename;

-- Expected policy counts (approximately):
-- app_users: 3+
-- teams: 2+
-- user_teams: 6+
-- questions: 2+
-- one_on_ones: 3+
-- answers: 2+
-- metrics_snapshots: 4+

-- =====================================================
-- 5. CHECK FUNCTIONS EXIST
-- =====================================================

SELECT 'Step 5: Checking functions...' as step;

SELECT
    routine_name,
    '✓ Exists' as status
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN ('handle_new_user', 'get_user_teams', 'get_team_members')
ORDER BY routine_name;

-- Should show:
-- get_team_members
-- get_user_teams
-- handle_new_user

-- =====================================================
-- 6. CHECK TRIGGERS EXIST
-- =====================================================

SELECT 'Step 6: Checking triggers...' as step;

SELECT
    trigger_name,
    event_object_table,
    '✓ Active' as status
FROM information_schema.triggers
WHERE trigger_schema = 'public'
OR (trigger_schema = 'auth' AND trigger_name = 'on_auth_user_created')
ORDER BY trigger_name;

-- =====================================================
-- 7. CHECK INDEXES EXIST
-- =====================================================

SELECT 'Step 7: Checking indexes...' as step;

SELECT
    tablename,
    indexname,
    '✓ Exists' as status
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename IN ('user_teams', 'one_on_ones', 'answers', 'metrics_snapshots')
ORDER BY tablename, indexname;

-- user_teams should have:
-- - idx_user_teams_user_id
-- - idx_user_teams_team_id

-- =====================================================
-- 8. CHECK DATA COUNTS
-- =====================================================

SELECT 'Step 8: Checking data counts...' as step;

SELECT 'app_users' as table_name, COUNT(*) as record_count FROM app_users
UNION ALL
SELECT 'teams', COUNT(*) FROM teams
UNION ALL
SELECT 'user_teams', COUNT(*) FROM user_teams
UNION ALL
SELECT 'questions', COUNT(*) FROM questions
UNION ALL
SELECT 'one_on_ones', COUNT(*) FROM one_on_ones
UNION ALL
SELECT 'answers', COUNT(*) FROM answers
UNION ALL
SELECT 'metrics_snapshots', COUNT(*) FROM metrics_snapshots
UNION ALL
SELECT 'notifications', COUNT(*) FROM notifications
ORDER BY table_name;

-- Expected for fresh install with test data:
-- app_users: 4+ (admin, manager, 2 developers)
-- teams: 3+ (Engineering, Product, Design)
-- user_teams: 2+ (developers assigned to teams)
-- questions: 5+ (from seed data)
-- one_on_ones: 0 (none created yet)
-- answers: 0 (none created yet)
-- metrics_snapshots: 0 (none calculated yet)
-- notifications: 0 (none created yet)

-- =====================================================
-- 9. VERIFY USER-TEAM RELATIONSHIPS
-- =====================================================

SELECT 'Step 9: Checking user-team relationships...' as step;

SELECT
    u.email,
    u.full_name,
    u.role,
    COUNT(ut.team_id) as team_count,
    STRING_AGG(t.name, ', ') as teams
FROM app_users u
LEFT JOIN user_teams ut ON ut.user_id = u.id
LEFT JOIN teams t ON t.id = ut.team_id
GROUP BY u.id, u.email, u.full_name, u.role
ORDER BY u.role, u.email;

-- Should show:
-- - Admin: 0 teams (admins don't need team assignment)
-- - Manager: 0 teams (managers manage teams, don't belong to them)
-- - Developers: 1+ teams each

-- =====================================================
-- 10. VERIFY MANAGER ASSIGNMENTS
-- =====================================================

SELECT 'Step 10: Checking manager assignments...' as step;

SELECT
    t.name as team_name,
    m.email as manager_email,
    m.full_name as manager_name,
    CASE
        WHEN m.id IS NOT NULL THEN '✓ Manager assigned'
        ELSE '✗ NO MANAGER'
    END as status
FROM teams t
LEFT JOIN app_users m ON m.id = t.manager_id
ORDER BY t.name;

-- Each team should have a manager assigned

-- =====================================================
-- 11. TEST SIMPLE QUERIES
-- =====================================================

SELECT 'Step 11: Testing simple queries...' as step;

-- Test 1: Query teams
SELECT 'Test 1: Query teams' as test;
SELECT COUNT(*) as team_count FROM teams;

-- Test 2: Query user_teams
SELECT 'Test 2: Query user_teams' as test;
SELECT COUNT(*) as user_team_count FROM user_teams;

-- Test 3: Query metrics (should be 0)
SELECT 'Test 3: Query metrics' as test;
SELECT COUNT(*) as metrics_count FROM metrics_snapshots;

-- Test 4: Join query
SELECT 'Test 4: Join app_users and user_teams' as test;
SELECT COUNT(*) as joined_count
FROM app_users u
JOIN user_teams ut ON ut.user_id = u.id
JOIN teams t ON t.id = ut.team_id;

-- =====================================================
-- 12. CHECK FOR COMMON ISSUES
-- =====================================================

SELECT 'Step 12: Checking for common issues...' as step;

-- Issue 1: Users without team_id column (should not exist)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'app_users'
        AND column_name = 'team_id'
    ) THEN
        RAISE WARNING '✗ ISSUE: app_users still has team_id column (should be removed)';
    ELSE
        RAISE NOTICE '✓ Good: app_users.team_id column removed';
    END IF;
END $$;

-- Issue 2: Orphaned user_teams (users not in app_users)
SELECT
    'Orphaned user_teams' as issue,
    COUNT(*) as count
FROM user_teams ut
WHERE NOT EXISTS (
    SELECT 1 FROM app_users WHERE id = ut.user_id
);
-- Should be 0

-- Issue 3: Orphaned user_teams (teams not in teams)
SELECT
    'Orphaned user_teams (invalid team)' as issue,
    COUNT(*) as count
FROM user_teams ut
WHERE NOT EXISTS (
    SELECT 1 FROM teams WHERE id = ut.team_id
);
-- Should be 0

-- =====================================================
-- FINAL SUMMARY
-- =====================================================

SELECT '===========================================' as line;
SELECT 'FINAL VERIFICATION SUMMARY' as title;
SELECT '===========================================' as line;

DO $$
DECLARE
    table_count INT;
    policy_count INT;
    function_count INT;
    user_count INT;
    team_count INT;
    ut_count INT;
BEGIN
    -- Count tables
    SELECT COUNT(*) INTO table_count
    FROM pg_tables
    WHERE schemaname = 'public'
    AND tablename IN ('app_users', 'teams', 'user_teams', 'questions', 'one_on_ones', 'answers', 'metrics_snapshots', 'notifications');

    -- Count policies
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies
    WHERE schemaname = 'public';

    -- Count functions
    SELECT COUNT(*) INTO function_count
    FROM information_schema.routines
    WHERE routine_schema = 'public';

    -- Count data
    SELECT COUNT(*) INTO user_count FROM app_users;
    SELECT COUNT(*) INTO team_count FROM teams;
    SELECT COUNT(*) INTO ut_count FROM user_teams;

    RAISE NOTICE '';
    RAISE NOTICE '=== INSTALLATION STATUS ===';
    RAISE NOTICE 'Core Tables: % / 8', table_count;
    RAISE NOTICE 'RLS Policies: %', policy_count;
    RAISE NOTICE 'Functions: %', function_count;
    RAISE NOTICE '';
    RAISE NOTICE '=== DATA STATUS ===';
    RAISE NOTICE 'Users: %', user_count;
    RAISE NOTICE 'Teams: %', team_count;
    RAISE NOTICE 'User-Team Assignments: %', ut_count;
    RAISE NOTICE '';

    IF table_count = 8 AND policy_count > 10 AND function_count >= 3 THEN
        RAISE NOTICE '✓✓✓ INSTALLATION SUCCESSFUL! ✓✓✓';
        RAISE NOTICE '';
        RAISE NOTICE 'Next steps:';
        RAISE NOTICE '1. Restart your dev server: npm run dev';
        RAISE NOTICE '2. Test login with each role';
        RAISE NOTICE '3. Create your first 1-on-1';
    ELSE
        RAISE NOTICE '✗ INSTALLATION INCOMPLETE';
        RAISE NOTICE '';
        RAISE NOTICE 'Issues found:';
        IF table_count < 8 THEN
            RAISE NOTICE '- Missing tables (expected 8, found %)', table_count;
        END IF;
        IF policy_count < 10 THEN
            RAISE NOTICE '- Insufficient RLS policies (expected 10+, found %)', policy_count;
        END IF;
        IF function_count < 3 THEN
            RAISE NOTICE '- Missing functions (expected 3+, found %)', function_count;
        END IF;
        RAISE NOTICE '';
        RAISE NOTICE 'Review FRESH_START_GUIDE.md and ensure all migrations were applied.';
    END IF;
END $$;

SELECT '===========================================' as line;
