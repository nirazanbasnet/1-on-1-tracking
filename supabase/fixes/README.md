# One-Time Fix Scripts

This folder contains SQL scripts for fixing specific issues. These are meant to be run once when encountering specific problems.

## Files

### `fix_rls_policies_final.sql`
- **Purpose**: Fix infinite recursion in RLS policies for multi-team support
- **When to use**: After applying the multi-team migration (00010_multi_team_support_fixed.sql)
- **What it does**:
  - Drops all existing policies that cause recursion
  - Creates new simplified policies without circular dependencies
  - Enables proper multi-team support
  - Runs diagnostic tests to verify the fix
- **How to use**:
  1. Open Supabase SQL Editor
  2. Copy and paste the entire contents
  3. Run the script
  4. Verify all tests pass
  5. Check the policy summary at the end

## Important Notes

- **Run fixes only once** unless explicitly told to re-run
- Always backup your database before running fix scripts
- Read the script comments to understand what it does
- Verify the fix worked by running diagnostic scripts in `../diagnostics/`
- These scripts modify database structure (unlike diagnostic scripts)

## After Running a Fix

1. Test the application thoroughly
2. Run relevant diagnostic scripts to verify
3. Document what was fixed and when
4. Consider if the fix should become a migration for new deployments
