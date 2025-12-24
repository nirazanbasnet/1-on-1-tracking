# Deployment Checklist - Multi-Team Support

This checklist covers all steps needed to deploy the multi-team support fixes to your environment.

## Current Status

### ✅ Completed (Code Changes)
- [x] Fixed all code references to old `team_id` column
- [x] Updated 5 files to use `user_teams` junction table
- [x] Created comprehensive RLS policy fix
- [x] Organized all SQL files into proper structure
- [x] Created documentation for all SQL folders
- [x] Updated troubleshooting guides

### ⏳ Pending (Database Changes)
- [ ] Apply RLS policy fix to database
- [ ] Calculate missing metrics for December
- [ ] Verify multi-team assignment works
- [ ] Test all user roles (admin, manager, developer)

## Step-by-Step Deployment

### Step 1: Backup Your Database
```sql
-- In Supabase Dashboard → Database → Backups
-- Create a manual backup before proceeding
```

**Why**: Safety first - you can rollback if anything goes wrong.

### Step 2: Apply RLS Policy Fix

1. Open Supabase SQL Editor
2. Open file: `supabase/fixes/fix_rls_policies_final.sql`
3. Copy entire contents
4. Paste into SQL Editor
5. Click "Run"

**Expected Output**:
```
Test 1: Querying teams... ✓
Test 2: Querying user_teams... ✓
Test 3: Querying metrics_snapshots... ✓
Test 4: Testing join query... ✓
SUCCESS: All policies fixed! No more infinite recursion.

NOTICE: === POLICY SUMMARY ===
NOTICE: App_users policies: 3
NOTICE: Teams policies: 2
NOTICE: User_teams policies: 6
NOTICE: Metrics_snapshots policies: 4
```

**If you get errors**: Screenshot the error and check troubleshooting section below.

### Step 3: Verify Database State

Run these diagnostic queries:

```sql
-- 1. Check user_teams table exists and has data
SELECT COUNT(*) as user_team_count FROM user_teams;
-- Should return > 0 if users are assigned to teams

-- 2. Check app_users no longer has team_id column
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'app_users' AND column_name = 'team_id';
-- Should return 0 rows

-- 3. Check RLS policies are correct
SELECT tablename, COUNT(*) as policy_count
FROM pg_policies
WHERE tablename IN ('teams', 'user_teams', 'metrics_snapshots')
GROUP BY tablename;
-- Should show: teams (2), user_teams (6), metrics_snapshots (4)
```

### Step 4: Calculate Missing December Metrics

1. First, find your completed 1-on-1 ID:
```sql
SELECT
  o.id,
  o.month_year,
  o.status,
  u.email as developer_email,
  (SELECT COUNT(*) FROM answers WHERE one_on_one_id = o.id) as answer_count,
  (SELECT COUNT(*) FROM metrics_snapshots WHERE one_on_one_id = o.id) as has_metrics
FROM one_on_ones o
JOIN app_users u ON u.id = o.developer_id
WHERE o.status = 'completed'
  AND o.month_year = '2024-12'
ORDER BY o.created_at DESC;
```

2. Copy the `id` of the 1-on-1 that needs metrics

3. Run the metrics calculation (replace `YOUR-ONE-ON-ONE-ID`):
```sql
DO $$
DECLARE
  v_one_on_one_id UUID := 'YOUR-ONE-ON-ONE-ID';
  v_developer_id UUID;
  v_team_id UUID;
  v_month_year TEXT;
  v_avg_score NUMERIC;
  v_dev_rating NUMERIC;
  v_mgr_rating NUMERIC;
  v_alignment NUMERIC;
BEGIN
  -- Get 1-on-1 details
  SELECT developer_id, team_id, month_year
  INTO v_developer_id, v_team_id, v_month_year
  FROM one_on_ones
  WHERE id = v_one_on_one_id;

  -- Calculate averages
  SELECT
    AVG(rating_value),
    AVG(CASE WHEN answer_type = 'developer' THEN rating_value END),
    AVG(CASE WHEN answer_type = 'manager' THEN rating_value END)
  INTO v_avg_score, v_dev_rating, v_mgr_rating
  FROM answers
  WHERE one_on_one_id = v_one_on_one_id
    AND rating_value IS NOT NULL;

  -- Calculate alignment
  IF v_dev_rating IS NOT NULL AND v_mgr_rating IS NOT NULL THEN
    v_alignment := ABS(v_dev_rating - v_mgr_rating);
  END IF;

  -- Insert or update metrics
  INSERT INTO metrics_snapshots (
    one_on_one_id,
    developer_id,
    team_id,
    month_year,
    average_score,
    metric_data
  ) VALUES (
    v_one_on_one_id,
    v_developer_id,
    v_team_id,
    v_month_year,
    v_avg_score,
    jsonb_build_object(
      'developer_avg_rating', v_dev_rating,
      'manager_avg_rating', v_mgr_rating,
      'rating_alignment', v_alignment,
      'total_questions', (SELECT COUNT(DISTINCT question_id) FROM answers WHERE one_on_one_id = v_one_on_one_id),
      'rating_questions', (SELECT COUNT(*) FROM answers WHERE one_on_one_id = v_one_on_one_id AND rating_value IS NOT NULL) / 2
    )
  )
  ON CONFLICT (one_on_one_id)
  DO UPDATE SET
    average_score = EXCLUDED.average_score,
    metric_data = EXCLUDED.metric_data,
    updated_at = NOW();

  RAISE NOTICE 'Metrics calculated: avg=%, dev=%, mgr=%, align=%',
    v_avg_score, v_dev_rating, v_mgr_rating, v_alignment;
END $$;
```

4. Verify metrics were created:
```sql
SELECT * FROM metrics_snapshots
WHERE month_year = '2024-12'
ORDER BY created_at DESC;
```

### Step 5: Restart Development Server

```bash
# Stop current server (Ctrl+C)
npm run dev
```

### Step 6: Test Each User Role

#### Test as Developer
1. Navigate to `/dashboard`
2. **Should see**:
   - No "infinite recursion" errors
   - December metrics in "Your Progress" section
   - Completed 1-on-1 for December

#### Test as Manager
1. Navigate to `/dashboard`
2. **Should see**:
   - Team members list
   - Ability to view developer profiles
   - Team statistics

3. Test assigning a 1-on-1:
   - Click "Create 1-on-1" for a developer
   - Should succeed without errors

#### Test as Admin
1. Navigate to `/dashboard`
2. Go to "User Management" section
3. Edit a user
4. **Should see**:
   - Multi-select checkboxes for teams
   - Ability to assign user to multiple teams

5. Test multi-team assignment:
   - Select 2 or more teams for a user
   - Click "Save"
   - **Should succeed**
   - User should now appear in both teams' member counts

### Step 7: Verify Multi-Team Functionality

Run this query to verify multi-team assignments work:

```sql
-- Show users with multiple teams
SELECT
  u.email,
  u.full_name,
  u.role,
  COUNT(ut.team_id) as team_count,
  STRING_AGG(t.name, ', ') as teams
FROM app_users u
LEFT JOIN user_teams ut ON ut.user_id = u.id
LEFT JOIN teams t ON t.id = ut.team_id
GROUP BY u.id, u.email, u.full_name, u.role
HAVING COUNT(ut.team_id) > 0
ORDER BY team_count DESC, u.email;
```

## Troubleshooting

### Error: "infinite recursion detected"

**Cause**: Old RLS policies still exist

**Fix**:
1. Re-run `supabase/fixes/fix_rls_policies_final.sql`
2. Verify all old policies were dropped:
```sql
SELECT tablename, policyname FROM pg_policies
WHERE tablename IN ('teams', 'user_teams')
ORDER BY tablename, policyname;
```

### Error: "table user_teams does not exist"

**Cause**: Migration `00010_multi_team_support_fixed.sql` not applied

**Fix**:
1. Run `supabase/migrations/00010_multi_team_support_fixed.sql`
2. Then run the RLS policy fix

### Metrics still not showing

**Cause**: Metrics not calculated or RLS blocking access

**Fix**:
1. Run diagnostic: `supabase/diagnostics/check_schema.sql`
2. Verify metrics exist: `SELECT * FROM metrics_snapshots;`
3. If empty, run Step 4 (Calculate Metrics)
4. Check RLS policies allow reading metrics

### "No Team Assigned" for manager

**Cause**: Manager user is not set as `manager_id` in teams table

**Fix**:
```sql
-- Find the manager's user ID
SELECT id, email, role FROM app_users WHERE role = 'manager';

-- Update team to assign this manager
UPDATE teams
SET manager_id = 'MANAGER-USER-ID'
WHERE id = 'TEAM-ID';
```

## Success Criteria

You know the deployment succeeded when:

- [ ] No "infinite recursion" errors anywhere
- [ ] Developer dashboard shows December metrics
- [ ] Manager can see team members
- [ ] Admin can assign users to multiple teams
- [ ] All diagnostic queries return expected results
- [ ] Browser console has no errors
- [ ] All 3 user roles work correctly

## Rollback Plan

If something goes wrong:

1. **Database**: Restore from backup created in Step 1
2. **Code**:
   ```bash
   git log --oneline  # Find commit before changes
   git checkout <commit-hash>
   npm run dev
   ```

## Post-Deployment

After successful deployment:

1. Monitor for errors in production
2. Test edge cases (users in multiple teams, etc.)
3. Consider implementing analytics page (see plan file)
4. Update team documentation

## Questions?

- Check `COMPLETE_FIX_SUMMARY.md` for code changes
- Check `SQL_ORGANIZATION.md` for SQL file locations
- Check `supabase/*/README.md` for specific guides
- Run diagnostic scripts from `supabase/diagnostics/`
