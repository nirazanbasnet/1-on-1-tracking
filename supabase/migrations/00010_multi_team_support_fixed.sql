-- =====================================================
-- Multi-Team Support Migration (FIXED)
-- =====================================================
-- This migration enables users to be assigned to multiple teams
-- by creating a junction table and migrating existing data

-- Step 1: Create the user_teams junction table
CREATE TABLE IF NOT EXISTS user_teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Ensure a user can only be added to a team once
    UNIQUE(user_id, team_id)
);

-- Step 2: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_teams_user_id ON user_teams(user_id);
CREATE INDEX IF NOT EXISTS idx_user_teams_team_id ON user_teams(team_id);

-- Step 3: Migrate existing team_id data to user_teams
-- Only migrate non-null team_id values that don't already exist
INSERT INTO user_teams (user_id, team_id)
SELECT id, team_id
FROM app_users
WHERE team_id IS NOT NULL
ON CONFLICT (user_id, team_id) DO NOTHING;

-- Step 4: Drop policies that depend on app_users.team_id
DROP POLICY IF EXISTS "Developers can view their team" ON teams;
DROP POLICY IF EXISTS "Users can view active questions" ON questions;

-- Step 5: Remove the team_id column from app_users
ALTER TABLE app_users DROP COLUMN IF EXISTS team_id;

-- Step 6: Recreate the policies using user_teams table
-- Policy: Developers can view their teams
CREATE POLICY "Developers can view their teams"
    ON teams
    FOR SELECT
    USING (
        auth.uid() = manager_id OR
        EXISTS (
            SELECT 1 FROM user_teams
            WHERE user_teams.team_id = teams.id
            AND user_teams.user_id = auth.uid()
        )
    );

-- Policy: Users can view active questions (company-wide or for their teams)
CREATE POLICY "Users can view active questions"
    ON questions
    FOR SELECT
    USING (
        is_active = true AND (
            scope = 'company' OR
            (scope = 'team' AND EXISTS (
                SELECT 1 FROM user_teams
                WHERE user_teams.team_id = questions.team_id
                AND user_teams.user_id = auth.uid()
            ))
        )
    );

-- Step 7: Add RLS policies for user_teams table
ALTER TABLE user_teams ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own team memberships
CREATE POLICY "Users can view their own team memberships"
    ON user_teams
    FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: Admins can view all team memberships
CREATE POLICY "Admins can view all team memberships"
    ON user_teams
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM app_users
            WHERE app_users.id = auth.uid()
            AND app_users.role = 'admin'
        )
    );

-- Policy: Managers can view their team memberships
CREATE POLICY "Managers can view their team memberships"
    ON user_teams
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM teams
            WHERE teams.id = user_teams.team_id
            AND teams.manager_id = auth.uid()
        )
    );

-- Policy: Admins can insert team memberships
CREATE POLICY "Admins can insert team memberships"
    ON user_teams
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM app_users
            WHERE app_users.id = auth.uid()
            AND app_users.role = 'admin'
        )
    );

-- Policy: Admins can update team memberships
CREATE POLICY "Admins can update team memberships"
    ON user_teams
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM app_users
            WHERE app_users.id = auth.uid()
            AND app_users.role = 'admin'
        )
    );

-- Policy: Admins can delete team memberships
CREATE POLICY "Admins can delete team memberships"
    ON user_teams
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM app_users
            WHERE app_users.id = auth.uid()
            AND app_users.role = 'admin'
        )
    );

-- Step 8: Create a helper function to get user's teams
CREATE OR REPLACE FUNCTION get_user_teams(p_user_id UUID)
RETURNS TABLE (
    team_id UUID,
    team_name TEXT,
    manager_id UUID,
    manager_name TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        t.id,
        t.name,
        t.manager_id,
        m.full_name
    FROM user_teams ut
    JOIN teams t ON t.id = ut.team_id
    LEFT JOIN app_users m ON m.id = t.manager_id
    WHERE ut.user_id = p_user_id
    ORDER BY t.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 9: Create a helper function to get team members
CREATE OR REPLACE FUNCTION get_team_members(p_team_id UUID)
RETURNS TABLE (
    user_id UUID,
    email TEXT,
    full_name TEXT,
    role user_role
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        u.id,
        u.email,
        u.full_name,
        u.role
    FROM user_teams ut
    JOIN app_users u ON u.id = ut.user_id
    WHERE ut.team_id = p_team_id
    ORDER BY u.full_name, u.email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 10: Add comments for documentation
COMMENT ON TABLE user_teams IS 'Junction table enabling many-to-many relationship between users and teams';
COMMENT ON FUNCTION get_user_teams IS 'Returns all teams a user belongs to';
COMMENT ON FUNCTION get_team_members IS 'Returns all members of a team';

-- Step 11: Verify the migration
DO $$
BEGIN
    -- Check if user_teams table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_teams') THEN
        RAISE NOTICE 'SUCCESS: user_teams table created';
    END IF;

    -- Check if team_id column is removed
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'app_users' AND column_name = 'team_id'
    ) THEN
        RAISE NOTICE 'SUCCESS: team_id column removed from app_users';
    END IF;

    -- Show migration results
    RAISE NOTICE 'Total user-team assignments: %', (SELECT COUNT(*) FROM user_teams);
END $$;
