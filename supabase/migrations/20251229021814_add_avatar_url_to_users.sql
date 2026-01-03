-- =====================================================
-- Add avatar_url column to app_users table
-- =====================================================

-- Add avatar_url column to store profile pictures from Google OAuth
ALTER TABLE app_users ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- =====================================================
-- Update handle_new_user function to capture avatar_url
-- =====================================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.app_users (id, email, full_name, avatar_url, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
        NEW.raw_user_meta_data->>'avatar_url', -- Capture Google profile picture
        'developer' -- Default role, admins can change this later
    )
    ON CONFLICT (id) DO UPDATE
    SET
        email = EXCLUDED.email,
        full_name = COALESCE(EXCLUDED.full_name, app_users.full_name),
        avatar_url = COALESCE(EXCLUDED.avatar_url, app_users.avatar_url),
        updated_at = NOW();

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- Backfill existing users with their Google profile pictures
-- =====================================================

-- Update existing users' avatar URLs from auth.users metadata
UPDATE app_users
SET avatar_url = auth.users.raw_user_meta_data->>'avatar_url'
FROM auth.users
WHERE app_users.id = auth.users.id
  AND app_users.avatar_url IS NULL
  AND auth.users.raw_user_meta_data->>'avatar_url' IS NOT NULL;
