-- =====================================================
-- Remove the restrictive user update policy
-- Admins can update any user via the admin policy
-- Regular users won't be able to update roles (no policy allows it)
-- =====================================================

-- Drop the problematic policy
DROP POLICY IF EXISTS "Users can update own profile" ON app_users;

-- The "Admins have full access to users" policy remains and allows admins to update anything
-- Regular users have no UPDATE policy, so they can't update their profiles via the app
-- (they can only be updated by admins)
