-- Check users in database
SELECT 
    'Total users in app_users:' as info,
    COUNT(*) as count
FROM app_users;

SELECT 
    'Users by role:' as info;

SELECT 
    role,
    COUNT(*) as count
FROM app_users
GROUP BY role;

SELECT 
    'All users:' as info;

SELECT 
    id,
    email,
    full_name,
    role,
    created_at
FROM app_users
ORDER BY created_at DESC;

SELECT 
    'User team assignments:' as info;

SELECT 
    u.email,
    u.role,
    t.name as team_name,
    ut.team_id
FROM app_users u
LEFT JOIN user_teams ut ON ut.user_id = u.id
LEFT JOIN teams t ON t.id = ut.team_id
ORDER BY u.email;
