# Complete Multi-Team Migration Fix

## What Was Fixed

I've identified and fixed **all** remaining references to the old `team_id` column in `app_users` table. The system now fully uses the `user_teams` junction table for many-to-many relationships.

## Files Updated

### 1. **supabase/fixes/fix_rls_policies_final.sql** (NEW)
- Handles existing policies gracefully (won't throw "already exists" error)
- Drops ALL existing policies dynamically before recreating
- Creates simplified policies with no circular dependencies
- Eliminates infinite recursion in RLS policies

### 2. **lib/one-on-ones/management.ts**
**Fixed 3 locations:**
- Line 38-46: `getOrCreateOneOnOne()` - Now queries `user_teams` to get developer's team
- Line 86-97: `createTeamOneOnOnes()` - Uses `user_teams` to find team developers
- Line 268-272: `canCompleteOneOnOne()` - Uses `team_id` from `one_on_ones` table instead of querying `app_users`

### 3. **lib/auth/user-context.ts**
**Fixed 2 locations:**
- Line 42-57: `getCurrentUserProfile()` - Fetches user's first team via `user_teams` junction table
- Line 113-123: `getTeamMembers()` - Uses `user_teams` to get all team members

### 4. **app/api/manager/one-on-ones/route.ts**
**Fixed entire function:**
- Line 36-126: Complete rewrite to use `user_teams` junction table
- Removed all references to `developer.team_id`
- Now queries `user_teams` to get team assignment and manager

### 5. **components/admin/team-management.tsx**
**Fixed 1 location:**
- Line 293-295: `teamMembers` calculation now uses `user.team_ids.includes(team.id)`

### 6. **app/actions/metrics.ts** (Previously fixed)
- Line 131-154: Uses `user_teams` to verify manager permissions

## How to Apply the Fix

### Step 1: Apply the Updated RLS Policy Fix

Run this SQL in your Supabase SQL Editor:

```bash
# Copy the contents of supabase/fixes/fix_rls_policies_final.sql and run it
```

This script will:
1. Show you all existing policies
2. Drop ALL policies on affected tables dynamically (no "already exists" errors)
3. Create new simplified policies with no recursion
4. Run test queries to verify everything works
5. Show a summary of all policies created

### Step 2: Verify No Errors

After running the SQL, you should see:
```
Test 1: Querying teams... ✓
Test 2: Querying user_teams... ✓
Test 3: Querying metrics_snapshots... ✓
Test 4: Testing join query... ✓
SUCCESS: All policies fixed! No more infinite recursion.
```

### Step 3: Restart Your Development Server

```bash
# Stop your current dev server (Ctrl+C)
# Then restart it
npm run dev
```

### Step 4: Test the Application

1. **Developer Profile**
   - Visit `/dashboard` as a developer
   - Should load without "infinite recursion" error
   - December metrics should appear (if you've calculated them)

2. **Manager Dashboard**
   - Visit `/dashboard` as a manager
   - Should see team members
   - Should be able to view developer profiles

3. **Admin Panel**
   - Visit `/dashboard` as admin
   - Test assigning multiple teams to a user
   - Should work with multi-select checkboxes

## Calculate Missing Metrics

If your December metrics still don't show, run this SQL to calculate them:

```sql
-- Replace 'YOUR-ONE-ON-ONE-ID' with the actual ID from the debug endpoint
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

  -- Calculate averages from answers with ratings
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

  -- Insert or update metrics snapshot
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
      'rating_alignment', v_alignment
    )
  )
  ON CONFLICT (one_on_one_id)
  DO UPDATE SET
    average_score = EXCLUDED.average_score,
    metric_data = EXCLUDED.metric_data,
    updated_at = NOW();

  RAISE NOTICE 'Metrics calculated successfully for 1-on-1: %', v_one_on_one_id;
END $$;
```

## What These Fixes Accomplish

### ✅ Infinite Recursion - FIXED
- No more circular dependencies in RLS policies
- Teams table can now be queried without recursion
- All tables have simplified, non-recursive policies

### ✅ Multi-Team Support - FULLY IMPLEMENTED
- All code now uses `user_teams` junction table
- Users can belong to multiple teams
- Admin UI supports multi-select team assignment

### ✅ Metrics Display - READY
- Once you run the metrics calculation SQL, December metrics will appear
- All permission checks now work correctly with the new schema

### ✅ Backward Compatibility - MAINTAINED
- One-on-ones still have `team_id` column for historical data
- Queries use `team_id` from `one_on_ones` instead of joining to `app_users`

## Verification Checklist

After applying the fixes, verify:

- [ ] `FIX_ALL_RLS_POLICIES_V2.sql` runs without errors
- [ ] All test queries succeed
- [ ] Developer dashboard loads without errors
- [ ] Manager dashboard shows team members
- [ ] Admin can assign multiple teams to users
- [ ] Metrics calculation SQL runs successfully
- [ ] December metrics appear on developer dashboard

## Troubleshooting

### If you still get "infinite recursion" error:
1. Make sure you ran `supabase/fixes/fix_rls_policies_final.sql`
2. Check that ALL old policies were dropped
3. Verify with:
   ```sql
   SELECT tablename, policyname FROM pg_policies
   WHERE tablename IN ('teams', 'user_teams', 'metrics_snapshots')
   ORDER BY tablename, policyname;
   ```

### If metrics still don't show:
1. Run the debug endpoint: `GET /api/debug/metrics`
2. Get the `one_on_one_id` from the response
3. Run the metrics calculation SQL with that ID
4. Refresh the dashboard

### If team assignment doesn't work:
1. Clear your browser cache
2. Restart the dev server
3. Check browser console for errors
4. Verify `user_teams` table has data:
   ```sql
   SELECT * FROM user_teams;
   ```

## Next Steps

After all fixes are applied and verified:
1. Consider implementing the analytics page (see plan file)
2. Add more robust error handling
3. Consider adding audit logs for team changes
4. Test edge cases (user in multiple teams, team without manager, etc.)

## Support

If you encounter any issues after applying these fixes:
1. Check the browser console for errors
2. Check Supabase logs for RLS violations
3. Run the verification queries above
4. Share the specific error message for further assistance
