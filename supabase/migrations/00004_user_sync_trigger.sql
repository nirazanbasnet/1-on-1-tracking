-- =====================================================
-- Auto-sync auth.users to app_users
-- =====================================================

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.app_users (id, email, full_name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
        'developer' -- Default role, admins can change this later
    )
    ON CONFLICT (id) DO UPDATE
    SET
        email = EXCLUDED.email,
        full_name = COALESCE(EXCLUDED.full_name, app_users.full_name),
        updated_at = NOW();

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to sync users on signup
CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();

-- Also sync on user update (in case profile info changes)
CREATE OR REPLACE TRIGGER on_auth_user_updated
    AFTER UPDATE ON auth.users
    FOR EACH ROW
    WHEN (
        OLD.email IS DISTINCT FROM NEW.email OR
        OLD.raw_user_meta_data IS DISTINCT FROM NEW.raw_user_meta_data
    )
    EXECUTE FUNCTION handle_new_user();

-- =====================================================
-- Helper function to promote user to admin
-- =====================================================
-- Run this manually for the first admin after they log in:
-- SELECT promote_to_admin('user-email@company.com');

CREATE OR REPLACE FUNCTION promote_to_admin(user_email TEXT)
RETURNS VOID AS $$
BEGIN
    UPDATE app_users
    SET role = 'admin'
    WHERE email = user_email;

    RAISE NOTICE 'User % has been promoted to admin', user_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- Helper function to promote user to manager
-- =====================================================

CREATE OR REPLACE FUNCTION promote_to_manager(user_email TEXT, assigned_team_id UUID DEFAULT NULL)
RETURNS VOID AS $$
BEGIN
    UPDATE app_users
    SET role = 'manager',
        team_id = COALESCE(assigned_team_id, team_id)
    WHERE email = user_email;

    -- Optionally set as team manager
    IF assigned_team_id IS NOT NULL THEN
        UPDATE teams
        SET manager_id = (SELECT id FROM app_users WHERE email = user_email)
        WHERE id = assigned_team_id;
    END IF;

    RAISE NOTICE 'User % has been promoted to manager', user_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- Helper function to assign user to team
-- =====================================================

CREATE OR REPLACE FUNCTION assign_to_team(user_email TEXT, assigned_team_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE app_users
    SET team_id = assigned_team_id
    WHERE email = user_email;

    RAISE NOTICE 'User % has been assigned to team %', user_email, assigned_team_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
