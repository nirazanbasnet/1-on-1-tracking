-- Diagnostic query to check admin status
-- Run this in Supabase SQL Editor

-- 1. Check your current user
SELECT
    auth.uid() as current_user_id,
    auth.email() as current_email;

-- 2. Check if you're in app_users and your role
SELECT id, email, role
FROM app_users
WHERE id = auth.uid();

-- 3. Check if is_admin function works
SELECT is_admin(auth.uid()) as am_i_admin;

-- 4. List all current RLS policies on app_users
SELECT
    policyname,
    cmd,
    permissive,
    roles
FROM pg_policies
WHERE tablename = 'app_users'
ORDER BY cmd, policyname;
