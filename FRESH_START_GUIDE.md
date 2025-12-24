# Fresh Database Setup Guide

This guide will help you completely reset your database and apply all migrations from scratch.

## ⚠️ WARNING

**This will DELETE ALL DATA in your database!**

- All users will be removed
- All teams will be removed
- All 1-on-1s will be removed
- All answers will be removed
- All metrics will be removed

**Only do this if you're okay losing all current data!**

---

## Step 1: Backup Current Data (Optional)

If you want to save any current data for reference:

```sql
-- Export users
COPY (SELECT * FROM app_users) TO '/tmp/app_users_backup.csv' CSV HEADER;

-- Export teams
COPY (SELECT * FROM teams) TO '/tmp/teams_backup.csv' CSV HEADER;

-- Export one_on_ones
COPY (SELECT * FROM one_on_ones) TO '/tmp/one_on_ones_backup.csv' CSV HEADER;
```

Or just screenshot important data you want to remember.

---

## Step 2: Drop All Existing Tables

Run this in Supabase SQL Editor:

```sql
-- =====================================================
-- NUCLEAR OPTION: Drop Everything and Start Fresh
-- =====================================================

-- Disable RLS on all tables first
ALTER TABLE IF EXISTS notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS metrics_snapshots DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS answers DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS one_on_ones DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS questions DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS user_teams DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS teams DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS app_users DISABLE ROW LEVEL SECURITY;

-- Drop all tables (CASCADE removes dependent objects)
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS metrics_snapshots CASCADE;
DROP TABLE IF EXISTS answers CASCADE;
DROP TABLE IF EXISTS one_on_ones CASCADE;
DROP TABLE IF EXISTS questions CASCADE;
DROP TABLE IF EXISTS user_teams CASCADE;
DROP TABLE IF EXISTS teams CASCADE;
DROP TABLE IF EXISTS app_users CASCADE;

-- Drop custom types
DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS question_type CASCADE;
DROP TYPE IF EXISTS question_scope CASCADE;
DROP TYPE IF EXISTS one_on_one_status CASCADE;
DROP TYPE IF EXISTS answer_type CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS get_user_teams(UUID) CASCADE;
DROP FUNCTION IF EXISTS get_team_members(UUID) CASCADE;
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;

-- Drop triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Verify everything is gone
SELECT tablename FROM pg_tables WHERE schemaname = 'public';
-- Should return empty or only non-project tables

SELECT proname FROM pg_proc WHERE pronamespace = 'public'::regnamespace;
-- Should return empty or only non-project functions
```

**Expected output**: "DROP TABLE" messages and empty results from SELECT queries.

---

## Step 3: Apply Migrations in Order

Now we'll apply each migration one by one.

### Migration 1: Initial Schema

**File**: `supabase/migrations/00001_initial_schema.sql`

Open the file, copy its contents, and run in Supabase SQL Editor.

**What it creates**:
- Custom types (user_role, question_type, etc.)
- Tables: app_users, teams, questions, one_on_ones, answers
- UUID extension

**Verify**:
```sql
SELECT tablename FROM pg_tables WHERE schemaname = 'public';
-- Should show: app_users, teams, questions, one_on_ones, answers
```

---

### Migration 2: Row Level Security

**File**: `supabase/migrations/00002_row_level_security.sql`

**What it does**:
- Enables RLS on all tables
- Creates initial security policies

**Verify**:
```sql
SELECT tablename, COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename;
-- Should show policies for each table
```

---

### Migration 3: Seed Data

**File**: `supabase/migrations/00003_seed_data.sql`

**What it does**:
- Creates default questions
- May create sample data

**Verify**:
```sql
SELECT COUNT(*) FROM questions;
-- Should show several questions
```

---

### Migration 4: User Sync Trigger

**File**: `supabase/migrations/00004_user_sync_trigger.sql`

**What it does**:
- Creates function to sync auth.users → app_users
- Creates trigger on new user signup

**Verify**:
```sql
SELECT proname FROM pg_proc WHERE proname = 'handle_new_user';
-- Should show: handle_new_user
```

---

### Migration 5: Fix RLS Recursion

**File**: `supabase/migrations/00005_fix_rls_recursion.sql`

**What it does**:
- First attempt at fixing RLS issues

**Verify**:
```sql
-- No specific verification needed
```

---

### Migration 6: Phase 5-6 Updates

**File**: `supabase/migrations/00006_update_schema_for_phase_5_6_safe.sql`

**What it does**:
- Adds columns for additional features

**Verify**:
```sql
-- Check for new columns if any
SELECT column_name FROM information_schema.columns
WHERE table_name = 'one_on_ones';
```

---

### Migration 7: Notifications

**File**: `supabase/migrations/00007_notifications_safe.sql`

**What it does**:
- Creates notifications table

**Verify**:
```sql
SELECT tablename FROM pg_tables WHERE tablename = 'notifications';
-- Should show: notifications
```

---

### Migration 8: Fix User Update Policy

**File**: `supabase/migrations/00008_fix_user_update_policy.sql`

**What it does**:
- Fixes user update permissions

**Verify**:
```sql
-- No specific verification needed
```

---

### Migration 9: Remove Restrictive Policy

**File**: `supabase/migrations/00009_remove_restrictive_policy.sql`

**What it does**:
- Removes overly restrictive policies

**Verify**:
```sql
-- No specific verification needed
```

---

### Migration 10: Multi-Team Support

**File**: `supabase/migrations/00010_multi_team_support_fixed.sql`

**IMPORTANT**: This migration expects `app_users.team_id` to exist, but it won't exist if we're starting fresh. We need to modify this migration.

**What it does**:
- Creates user_teams junction table
- Migrates data from team_id (won't exist in fresh install)
- Drops team_id column (won't exist)
- Creates helper functions

**Modified version for fresh install**:

```sql
-- =====================================================
-- Multi-Team Support Migration (FRESH INSTALL VERSION)
-- =====================================================

-- Step 1: Create the user_teams junction table
CREATE TABLE IF NOT EXISTS user_teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, team_id)
);

-- Step 2: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_teams_user_id ON user_teams(user_id);
CREATE INDEX IF NOT EXISTS idx_user_teams_team_id ON user_teams(team_id);

-- Step 3: Enable RLS
ALTER TABLE user_teams ENABLE ROW LEVEL SECURITY;

-- Step 4: Create RLS policies for user_teams table
CREATE POLICY "users_view_own_memberships"
    ON user_teams FOR SELECT TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "admins_view_all_memberships"
    ON user_teams FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM app_users
            WHERE app_users.id = auth.uid()
            AND app_users.role = 'admin'
        )
    );

CREATE POLICY "managers_view_team_memberships"
    ON user_teams FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM app_users a
            WHERE a.id = auth.uid()
            AND a.role = 'manager'
        )
    );

CREATE POLICY "admins_insert_memberships"
    ON user_teams FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM app_users
            WHERE app_users.id = auth.uid()
            AND app_users.role = 'admin'
        )
    );

CREATE POLICY "admins_update_memberships"
    ON user_teams FOR UPDATE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM app_users
            WHERE app_users.id = auth.uid()
            AND app_users.role = 'admin'
        )
    );

CREATE POLICY "admins_delete_memberships"
    ON user_teams FOR DELETE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM app_users
            WHERE app_users.id = auth.uid()
            AND app_users.role = 'admin'
        )
    );

-- Step 5: Create helper functions
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

-- Step 6: Add comments
COMMENT ON TABLE user_teams IS 'Junction table enabling many-to-many relationship between users and teams';
COMMENT ON FUNCTION get_user_teams IS 'Returns all teams a user belongs to';
COMMENT ON FUNCTION get_team_members IS 'Returns all members of a team';

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Multi-team support created successfully (fresh install)';
    RAISE NOTICE 'user_teams table: %', (SELECT COUNT(*) FROM user_teams);
END $$;
```

Copy this modified version and run it instead of the original.

---

### Final Step: Apply RLS Policy Fix

**File**: `supabase/fixes/fix_rls_policies_final.sql`

**What it does**:
- Simplifies all RLS policies
- Eliminates any remaining recursion
- Creates clean, working policies

Run this file in Supabase SQL Editor.

**Verify**:
```sql
-- All tests should pass
SELECT 'Test: Querying teams' as test;
SELECT COUNT(*) FROM teams;

SELECT 'Test: Querying user_teams' as test;
SELECT COUNT(*) FROM user_teams;

SELECT 'SUCCESS: All policies working!' as result;
```

---

## Step 4: Create Initial Data

Now let's create some test data to work with.

```sql
-- =====================================================
-- Create Test Data for Fresh Install
-- =====================================================

-- Create Admin User (manually)
-- Note: This user must exist in auth.users first
-- Go to Supabase Dashboard → Authentication → Users
-- Create a user with email/password
-- Then run this with their UUID:

INSERT INTO app_users (id, email, full_name, role, created_at)
VALUES (
    'YOUR-AUTH-USER-ID-HERE',  -- Replace with actual auth.users ID
    'admin@example.com',
    'Admin User',
    'admin',
    NOW()
)
ON CONFLICT (id) DO UPDATE
SET role = 'admin';

-- Create Teams
INSERT INTO teams (id, name, created_at) VALUES
    ('11111111-1111-1111-1111-111111111111', 'Engineering', NOW()),
    ('22222222-2222-2222-2222-222222222222', 'Product', NOW()),
    ('33333333-3333-3333-3333-333333333333', 'Design', NOW())
ON CONFLICT (id) DO NOTHING;

-- Show created teams
SELECT * FROM teams;
```

---

## Step 5: Create Test Users via Supabase Dashboard

1. Go to Supabase Dashboard → Authentication → Users
2. Click "Add User" → "Create new user"
3. Create these users:

### Manager User
- **Email**: `manager@example.com`
- **Password**: `manager123` (or your choice)
- **Auto-confirm**: Yes

### Developer Users
- **Email**: `developer1@example.com`
- **Password**: `dev123`
- **Auto-confirm**: Yes

- **Email**: `developer2@example.com`
- **Password**: `dev123`
- **Auto-confirm**: Yes

---

## Step 6: Assign Roles and Teams

After creating users in auth, they'll auto-create in app_users via trigger.

```sql
-- Get user IDs
SELECT id, email FROM auth.users;

-- Update roles (replace UUIDs with actual IDs from above)
UPDATE app_users
SET role = 'manager', full_name = 'Manager User'
WHERE email = 'manager@example.com';

UPDATE app_users
SET role = 'developer', full_name = 'Developer One'
WHERE email = 'developer1@example.com';

UPDATE app_users
SET role = 'developer', full_name = 'Developer Two'
WHERE email = 'developer2@example.com';

-- Assign manager to Engineering team
UPDATE teams
SET manager_id = (SELECT id FROM app_users WHERE email = 'manager@example.com')
WHERE name = 'Engineering';

-- Assign developers to teams (using user_teams)
INSERT INTO user_teams (user_id, team_id)
SELECT u.id, t.id
FROM app_users u
CROSS JOIN teams t
WHERE u.email = 'developer1@example.com'
  AND t.name = 'Engineering'
ON CONFLICT DO NOTHING;

INSERT INTO user_teams (user_id, team_id)
SELECT u.id, t.id
FROM app_users u
CROSS JOIN teams t
WHERE u.email = 'developer2@example.com'
  AND t.name = 'Engineering'
ON CONFLICT DO NOTHING;

-- Verify assignments
SELECT
    u.email,
    u.full_name,
    u.role,
    STRING_AGG(t.name, ', ') as teams
FROM app_users u
LEFT JOIN user_teams ut ON ut.user_id = u.id
LEFT JOIN teams t ON t.id = ut.team_id
GROUP BY u.id, u.email, u.full_name, u.role
ORDER BY u.role, u.email;
```

---

## Step 7: Verify Everything Works

### Check Tables
```sql
SELECT 'App Users' as table_name, COUNT(*) as count FROM app_users
UNION ALL
SELECT 'Teams', COUNT(*) FROM teams
UNION ALL
SELECT 'User Teams', COUNT(*) FROM user_teams
UNION ALL
SELECT 'Questions', COUNT(*) FROM questions
UNION ALL
SELECT 'One on Ones', COUNT(*) FROM one_on_ones
UNION ALL
SELECT 'Answers', COUNT(*) FROM answers
UNION ALL
SELECT 'Metrics', COUNT(*) FROM metrics_snapshots;
```

### Check RLS Policies
```sql
SELECT tablename, COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;
```

### Check Functions
```sql
SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
ORDER BY routine_name;
```

---

## Step 8: Test the Application

1. **Restart your dev server**:
```bash
npm run dev
```

2. **Login as Admin** (`admin@example.com`)
   - Should see admin dashboard
   - Can see all users
   - Can manage teams

3. **Login as Manager** (`manager@example.com`)
   - Should see Engineering team
   - Can see developers
   - Can create 1-on-1s

4. **Login as Developer** (`developer1@example.com`)
   - Should see dashboard
   - Should see assigned team
   - Can view 1-on-1s

---

## Troubleshooting

### Issue: User not created in app_users after signup
**Cause**: Trigger not working
**Fix**:
```sql
-- Manually insert
INSERT INTO app_users (id, email, full_name, role)
SELECT id, email, email, 'developer'
FROM auth.users
WHERE email = 'developer1@example.com'
ON CONFLICT (id) DO NOTHING;
```

### Issue: "Permission denied" errors
**Cause**: RLS policies too restrictive
**Fix**: Re-run `supabase/fixes/fix_rls_policies_final.sql`

### Issue: Cannot create 1-on-1s
**Cause**: Developer not assigned to team
**Fix**:
```sql
-- Verify team assignment
SELECT * FROM user_teams WHERE user_id = (
    SELECT id FROM app_users WHERE email = 'developer1@example.com'
);

-- Add if missing
INSERT INTO user_teams (user_id, team_id)
VALUES (
    (SELECT id FROM app_users WHERE email = 'developer1@example.com'),
    (SELECT id FROM teams WHERE name = 'Engineering')
);
```

---

## Summary Checklist

- [ ] Backed up important data (if needed)
- [ ] Dropped all tables
- [ ] Applied migration 00001 (initial schema)
- [ ] Applied migration 00002 (RLS)
- [ ] Applied migration 00003 (seed data)
- [ ] Applied migration 00004 (user sync trigger)
- [ ] Applied migration 00005-00009 (various fixes)
- [ ] Applied migration 00010 (multi-team) - modified version
- [ ] Applied RLS policy fix
- [ ] Created test users in auth
- [ ] Assigned roles to users
- [ ] Created teams
- [ ] Assigned users to teams
- [ ] Verified all tables and policies
- [ ] Tested application as each role
- [ ] Everything works! ✅

---

## Next Steps After Fresh Install

1. **Create Questions** (if seed data didn't add enough)
   - Go to admin dashboard
   - Add company-wide questions
   - Add team-specific questions

2. **Create First 1-on-1**
   - Login as manager
   - Create 1-on-1 for a developer
   - Test the full workflow

3. **Test Multi-Team**
   - Assign a developer to multiple teams
   - Verify they see both teams
   - Test 1-on-1 creation from different teams

4. **Implement Features**
   - Follow `WHATS_NEXT.md` for roadmap
   - Consider starting with analytics page

---

**You're all set with a fresh, clean database!** 🎉
