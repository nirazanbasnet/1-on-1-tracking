-- =====================================================
-- Remove Test/Random Metrics Data
-- =====================================================
-- This script removes any metrics that don't have
-- corresponding completed 1-on-1s

-- Step 1: Show current metrics
SELECT 'Current metrics in database:' as info;

SELECT
    ms.id,
    ms.month_year,
    ms.average_score,
    u.email as developer_email,
    o.status as one_on_one_status,
    CASE
        WHEN o.id IS NULL THEN '✗ No 1-on-1 exists'
        WHEN o.status != 'completed' THEN '✗ 1-on-1 not completed'
        ELSE '✓ Valid metric'
    END as validity
FROM metrics_snapshots ms
LEFT JOIN app_users u ON u.id = ms.developer_id
LEFT JOIN one_on_ones o ON o.id = ms.one_on_one_id
ORDER BY ms.created_at DESC;

-- Step 2: Find orphaned metrics (no matching 1-on-1)
SELECT 'Orphaned metrics (no matching 1-on-1):' as info;

SELECT
    ms.id,
    ms.month_year,
    ms.average_score,
    u.email
FROM metrics_snapshots ms
LEFT JOIN one_on_ones o ON o.id = ms.one_on_one_id
LEFT JOIN app_users u ON u.id = ms.developer_id
WHERE o.id IS NULL;

-- Step 3: Find metrics for incomplete 1-on-1s
SELECT 'Metrics for non-completed 1-on-1s:' as info;

SELECT
    ms.id,
    ms.month_year,
    ms.average_score,
    u.email,
    o.status
FROM metrics_snapshots ms
JOIN one_on_ones o ON o.id = ms.one_on_one_id
LEFT JOIN app_users u ON u.id = ms.developer_id
WHERE o.status != 'completed';

-- Step 4: Delete orphaned metrics (UNCOMMENT TO EXECUTE)
/*
DELETE FROM metrics_snapshots
WHERE id IN (
    SELECT ms.id
    FROM metrics_snapshots ms
    LEFT JOIN one_on_ones o ON o.id = ms.one_on_one_id
    WHERE o.id IS NULL
);
*/

-- Step 5: Delete metrics for non-completed 1-on-1s (UNCOMMENT TO EXECUTE)
/*
DELETE FROM metrics_snapshots
WHERE id IN (
    SELECT ms.id
    FROM metrics_snapshots ms
    JOIN one_on_ones o ON o.id = ms.one_on_one_id
    WHERE o.status != 'completed'
);
*/

-- Step 6: Show final count
SELECT
    'Total metrics remaining:' as info,
    COUNT(*) as count
FROM metrics_snapshots;

-- =====================================================
-- To execute the cleanup:
-- 1. Review the queries above
-- 2. Uncomment the DELETE statements in Step 4 and 5
-- 3. Run the script again
-- =====================================================
