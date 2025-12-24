-- =====================================================
-- Fix RLS policy to allow admins to update any user's role
-- =====================================================

-- Drop the restrictive policy that prevents role changes
DROP POLICY IF EXISTS "Users can update own profile" ON app_users;

-- Recreate with better logic: users can update their own profile but NOT their role
-- Unless they're an admin (who can change anyone's role via the admin policy)
CREATE POLICY "Users can update own profile"
    ON app_users FOR UPDATE
    USING (id = auth.uid() AND NOT is_admin(auth.uid()))
    WITH CHECK (
        id = auth.uid()
        AND NOT is_admin(auth.uid())
        AND role = (SELECT role FROM app_users WHERE id = auth.uid())
    );

-- The admin policy already exists and allows admins to update everything:
-- CREATE POLICY "Admins have full access to users"
--     ON app_users FOR ALL
--     USING (is_admin(auth.uid()))
--     WITH CHECK (is_admin(auth.uid()));

-- This way:
-- - Regular users can update their profile but NOT their role
-- - Admins use the "Admins have full access" policy and can update anyone's role
