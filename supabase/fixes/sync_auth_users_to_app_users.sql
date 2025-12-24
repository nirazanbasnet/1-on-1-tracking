-- =====================================================
-- Sync Auth Users to App Users
-- =====================================================
-- Creates app_users records for any auth.users that are missing them

-- First, let's see what users exist in auth but not in app_users
SELECT 'Users in auth.users but NOT in app_users:' as status;

SELECT
    au.id,
    au.email,
    au.created_at
FROM auth.users au
LEFT JOIN app_users ap ON ap.id = au.id
WHERE ap.id IS NULL
ORDER BY au.created_at;

-- Now create the missing records
INSERT INTO app_users (id, email, full_name, role, created_at)
SELECT
    au.id,
    au.email,
    COALESCE(au.raw_user_meta_data->>'full_name', au.email) as full_name,
    'developer'::user_role as role,  -- Default to developer
    au.created_at
FROM auth.users au
LEFT JOIN app_users ap ON ap.id = au.id
WHERE ap.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- Show what was created
SELECT
    CASE
        WHEN COUNT(*) > 0 THEN '✓ Created ' || COUNT(*) || ' app_users records'
        ELSE '✓ All auth users already have app_users records'
    END as result
FROM auth.users au
LEFT JOIN app_users ap ON ap.id = au.id
WHERE ap.id IS NULL;

-- Verify all users are synced now
SELECT 'Verification - All users in app_users:' as status;

SELECT
    ap.id,
    ap.email,
    ap.full_name,
    ap.role,
    CASE
        WHEN EXISTS (SELECT 1 FROM auth.users WHERE id = ap.id) THEN '✓ Has auth'
        ELSE '✗ No auth (orphaned)'
    END as auth_status
FROM app_users ap
ORDER BY ap.created_at DESC;

-- =====================================================
-- Optional: Set specific user as admin
-- =====================================================

-- Uncomment and modify this to make a specific user an admin:

/*
UPDATE app_users
SET role = 'admin'::user_role,
    full_name = 'Admin User'
WHERE email = 'YOUR-EMAIL@example.com';

SELECT '✓ Updated ' || email || ' to admin' as result
FROM app_users
WHERE role = 'admin';
*/

-- =====================================================
-- Check trigger is working
-- =====================================================

SELECT 'Checking if trigger exists:' as status;

SELECT
    trigger_name,
    event_manipulation,
    action_statement,
    '✓ Trigger exists' as status
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created'
AND event_object_table = 'users'
AND event_object_schema = 'auth';

-- If trigger doesn't exist, you need to apply migration 00004

SELECT '=== SYNC COMPLETE ===' as status;
