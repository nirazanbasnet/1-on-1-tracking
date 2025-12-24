-- =====================================================
-- Check Manager Assignment Issues
-- =====================================================

-- Step 1: Show all users with manager role
SELECT 'Users with manager role:' as info;

SELECT
    id,
    email,
    full_name,
    role,
    created_at
FROM app_users
WHERE role = 'manager'
ORDER BY email;

-- Step 2: Show all teams and their assigned managers
SELECT 'Teams and their managers:' as info;

SELECT
    t.id as team_id,
    t.name as team_name,
    t.manager_id,
    m.email as manager_email,
    m.full_name as manager_name,
    m.role as manager_role,
    CASE
        WHEN t.manager_id IS NULL THEN '✗ No manager assigned'
        WHEN m.id IS NULL THEN '✗ Manager ID invalid (user not found)'
        WHEN m.role != 'manager' THEN '✗ User exists but role is not manager'
        ELSE '✓ Manager correctly assigned'
    END as status
FROM teams t
LEFT JOIN app_users m ON m.id = t.manager_id
ORDER BY t.name;

-- Step 3: Show managers and their teams
SELECT 'Managers and which teams they manage:' as info;

SELECT
    u.id as user_id,
    u.email,
    u.full_name,
    u.role,
    COUNT(t.id) as teams_managed,
    STRING_AGG(t.name, ', ') as team_names
FROM app_users u
LEFT JOIN teams t ON t.manager_id = u.id
WHERE u.role = 'manager'
GROUP BY u.id, u.email, u.full_name, u.role
ORDER BY u.email;

-- Step 4: Check for common issues
SELECT 'Common Issues Check:' as info;

-- Issue 1: Managers without teams
SELECT
    'Managers without teams' as issue,
    COUNT(*) as count,
    STRING_AGG(email, ', ') as affected_users
FROM app_users u
WHERE u.role = 'manager'
AND NOT EXISTS (SELECT 1 FROM teams WHERE manager_id = u.id);

-- Issue 2: Teams without managers
SELECT
    'Teams without managers' as issue,
    COUNT(*) as count,
    STRING_AGG(name, ', ') as affected_teams
FROM teams
WHERE manager_id IS NULL;

-- Issue 3: Teams with invalid manager IDs
SELECT
    'Teams with invalid manager IDs' as issue,
    COUNT(*) as count,
    STRING_AGG(name, ', ') as affected_teams
FROM teams t
WHERE manager_id IS NOT NULL
AND NOT EXISTS (SELECT 1 FROM app_users WHERE id = t.manager_id);

-- Step 5: Detailed breakdown for troubleshooting
SELECT 'Detailed manager-team mapping:' as info;

SELECT
    u.email as manager_email,
    u.id as manager_user_id,
    t.name as manages_team,
    t.id as team_id,
    t.manager_id as team_manager_id_column,
    CASE
        WHEN u.id = t.manager_id THEN '✓ IDs match'
        ELSE '✗ IDs DO NOT match'
    END as id_match_status
FROM app_users u
CROSS JOIN teams t
WHERE u.role = 'manager'
ORDER BY u.email, t.name;
