# Metrics Not Showing - Troubleshooting Guide

## Problem
Developer 1-on-1s are completed but progress metrics are not showing on the dashboard.

## Quick Fix

### Step 1: Check Metrics Status

Visit this URL (replace with your actual domain):
```
http://localhost:3000/api/debug/metrics
```

Or run this SQL query in Supabase:
```sql
-- Check completed 1-on-1s and their metrics
SELECT
  o.id as one_on_one_id,
  o.month_year,
  o.status,
  o.completed_at,
  u.email as developer_email,
  m.id as has_metrics,
  (SELECT COUNT(*) FROM answers WHERE one_on_one_id = o.id) as answer_count
FROM one_on_ones o
LEFT JOIN app_users u ON u.id = o.developer_id
LEFT JOIN metrics_snapshots m ON m.one_on_one_id = o.id
WHERE o.status = 'completed'
ORDER BY o.month_year DESC;
```

### Step 2: Identify the Issue

**Issue A: No metrics_snapshots records**
If the query shows `has_metrics` is NULL, metrics weren't calculated.

**Issue B: No answers**
If `answer_count` is 0, the 1-on-1 has no answers to calculate from.

**Issue C: No rating answers**
If answers exist but have no `rating_value`, only text answers were provided.

### Step 3: Fix Missing Metrics

#### Option 1: Using the API (Recommended)

Use this curl command for each completed 1-on-1:
```bash
curl -X POST http://localhost:3000/api/debug/metrics \
  -H "Content-Type: application/json" \
  -d '{"one_on_one_id": "YOUR-ONE-ON-ONE-ID-HERE"}'
```

#### Option 2: Using SQL (Direct)

Run this in Supabase SQL Editor:
```sql
-- Get the 1-on-1 ID you want to fix
SELECT id, month_year, developer_id
FROM one_on_ones
WHERE status = 'completed'
  AND month_year = '2025-12'
LIMIT 1;

-- Then manually calculate and insert metrics
-- Replace 'YOUR-ONE-ON-ONE-ID' with actual ID from above
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

### Step 4: Verify the Fix

1. **Check metrics_snapshots table:**
```sql
SELECT * FROM metrics_snapshots
WHERE month_year = '2025-12'
ORDER BY created_at DESC;
```

2. **Refresh the dashboard:**
   - Go to `/dashboard`
   - You should now see the "Your Progress" section with metrics

3. **Check the stats card:**
   - The "Avg Performance" card should show a number instead of "N/A"

## Common Issues and Solutions

### Issue: "No metrics yet" message on dashboard

**Cause:** `metrics_snapshots` table is empty for this developer

**Solution:**
1. Verify 1-on-1 status is "completed" (not "submitted" or "reviewed")
2. Verify answers exist with `rating_value` (not just text)
3. Use the fix above to recalculate metrics

### Issue: Metrics show but "Avg Performance" is N/A

**Cause:** The dashboard query might be filtering incorrectly

**Check:**
```sql
-- This is what the dashboard runs
SELECT * FROM metrics_snapshots
WHERE developer_id = 'YOUR-DEVELOPER-ID'
ORDER BY month_year DESC
LIMIT 6;
```

**Fix:** If this returns no results, check the `developer_id` in metrics_snapshots matches the logged-in user.

### Issue: 1-on-1 is "completed" but calculateAndSaveMetrics failed

**Symptoms:**
- Status shows "completed"
- `completed_at` timestamp is set
- No entry in `metrics_snapshots`

**Possible causes:**
1. No answers with `rating_value` (only text answers)
2. RLS policy blocking the insert
3. team_id is NULL in one_on_ones table

**Solution:**
```sql
-- Check for answers
SELECT
  a.id,
  a.answer_type,
  a.rating_value,
  a.text_value,
  q.question_type
FROM answers a
JOIN questions q ON q.id = a.question_id
WHERE a.one_on_one_id = 'YOUR-ONE-ON-ONE-ID';

-- If rating_value is NULL for all answers:
-- The questions might not be rating type questions
-- Check your questions table:
SELECT id, question_text, question_type
FROM questions
WHERE is_active = true;
```

### Issue: team_id is NULL

**Cause:** 1-on-1 was created without a team_id

**Fix:**
```sql
-- Update the one_on_one with the correct team_id
UPDATE one_on_ones o
SET team_id = (
  SELECT ut.team_id
  FROM user_teams ut
  WHERE ut.user_id = o.developer_id
  LIMIT 1
)
WHERE o.id = 'YOUR-ONE-ON-ONE-ID'
  AND o.team_id IS NULL;
```

## Automated Fix Script

For fixing all completed 1-on-1s missing metrics:

```sql
-- Find all completed 1-on-1s without metrics
WITH missing_metrics AS (
  SELECT o.id
  FROM one_on_ones o
  LEFT JOIN metrics_snapshots m ON m.one_on_one_id = o.id
  WHERE o.status = 'completed'
    AND m.id IS NULL
)
SELECT
  'curl -X POST http://localhost:3000/api/debug/metrics -H "Content-Type: application/json" -d ''{"one_on_one_id": "' || id || '"}''' as command
FROM missing_metrics;
```

Copy and run each curl command generated.

## Prevention

To prevent this issue in the future:

1. **Ensure questions have rating type:**
```sql
-- Check your questions
SELECT * FROM questions WHERE is_active = true;

-- At least some should be rating type:
-- question_type should be 'rating_1_5' or 'rating_1_10'
```

2. **Monitor metrics calculation:**
   - Check server logs when completing a 1-on-1
   - Look for errors from `calculateAndSaveMetrics`

3. **Test the flow:**
   - Complete a test 1-on-1
   - Verify metrics appear immediately
   - Check both dashboard and analytics pages

## Still Not Working?

If metrics still don't show after following these steps:

1. Check browser console for errors
2. Check Supabase logs for RLS policy violations
3. Verify the migration `00010_multi_team_support.sql` was applied (if using multi-team)
4. Check if `one_on_ones.team_id` column exists and has values

Contact support with:
- Results from the diagnostic SQL queries
- Screenshot of the dashboard
- Browser console errors
