# SQL Files Organization Summary

All SQL files have been organized into a clear, maintainable structure within the `supabase/` folder.

## New Structure

```
supabase/
├── README.md                          # Main guide for SQL organization
├── migrations/                        # Database migrations (numbered)
│   ├── README.md                      # Migration guidelines
│   ├── 00001_initial_schema.sql
│   ├── 00002_row_level_security.sql
│   ├── 00003_seed_data.sql
│   ├── 00004_user_sync_trigger.sql
│   ├── 00005_fix_rls_recursion.sql
│   ├── 00006_update_schema_for_phase_5_6_safe.sql
│   ├── 00007_notifications_safe.sql
│   ├── 00008_fix_user_update_policy.sql
│   ├── 00009_remove_restrictive_policy.sql
│   └── 00010_multi_team_support_fixed.sql
├── diagnostics/                       # Read-only diagnostic scripts
│   ├── README.md                      # Diagnostic script guide
│   ├── check_schema.sql               # Verify schema structure
│   ├── check_policies.sql             # Quick policy count check
│   ├── check_policies_detailed.sql    # Detailed policy inspection
│   └── diagnose_admin.sql             # Admin user diagnostics
└── fixes/                             # One-time fix scripts
    ├── README.md                      # Fix script guide
    └── fix_rls_policies_final.sql     # Final RLS recursion fix
```

## What Changed

### Moved from Root → `supabase/diagnostics/`
- ❌ `CHECK_SCHEMA.sql` → ✅ `supabase/diagnostics/check_schema.sql`
- ❌ `CHECK_POLICIES.sql` → ✅ `supabase/diagnostics/check_policies.sql`
- ❌ `DIAGNOSE_ADMIN.sql` → ✅ `supabase/diagnostics/diagnose_admin.sql`

### Moved from Root → `supabase/fixes/`
- ❌ `FIX_ALL_RLS_POLICIES_V2.sql` → ✅ `supabase/fixes/fix_rls_policies_final.sql`

### Deleted (Obsolete Versions)
- ❌ `FIX_RLS_POLICIES.sql` (old version)
- ❌ `FIX_ALL_RLS_POLICIES.sql` (old version)

### Moved from `supabase/` → `supabase/diagnostics/`
- ❌ `supabase/check_policies.sql` → ✅ `supabase/diagnostics/check_policies_detailed.sql`

### Created New Documentation
- ✅ `supabase/README.md` - Main SQL organization guide
- ✅ `supabase/migrations/README.md` - Migration guidelines
- ✅ `supabase/diagnostics/README.md` - Diagnostic scripts guide
- ✅ `supabase/fixes/README.md` - Fix scripts guide

## Naming Conventions

### Migrations
- **Format**: `XXXXX_description.sql`
- **Example**: `00010_multi_team_support_fixed.sql`
- **Convention**: Five-digit sequential number, snake_case description

### Diagnostics
- **Format**: `check_*.sql` or `diagnose_*.sql`
- **Example**: `check_schema.sql`, `diagnose_admin.sql`
- **Convention**: Lowercase, underscores, descriptive names

### Fixes
- **Format**: `fix_*.sql`
- **Example**: `fix_rls_policies_final.sql`
- **Convention**: Lowercase, underscores, problem description

## Quick Reference

### Need to check database state?
```bash
# Run scripts from supabase/diagnostics/
```

### Need to fix an issue?
```bash
# Run scripts from supabase/fixes/
# ⚠️ Read the script first - these modify data!
```

### Need to make schema changes?
```bash
# Create new migration in supabase/migrations/
# Example: 00011_add_analytics_tables.sql
```

## Updated Documentation

The following files have been updated to reference the new SQL locations:
- ✅ `COMPLETE_FIX_SUMMARY.md` - Now references `supabase/fixes/fix_rls_policies_final.sql`

## Benefits of This Organization

1. **Clear Separation**: Migrations, diagnostics, and fixes are clearly separated
2. **Consistent Naming**: All files follow lowercase_snake_case convention
3. **Self-Documenting**: Each folder has a README explaining its purpose
4. **Version Control**: No more duplicate fix scripts with v1, v2, etc.
5. **Easy Navigation**: Know exactly where to find what you need
6. **Safe Execution**: Diagnostic scripts are clearly read-only

## Next Time You Need SQL

### To diagnose an issue:
1. Go to `supabase/diagnostics/`
2. Find the appropriate script
3. Run it in Supabase SQL Editor
4. Use output to identify the problem

### To fix an issue:
1. Check if a fix exists in `supabase/fixes/`
2. Read the script carefully
3. Backup your database
4. Run the fix
5. Verify with diagnostic scripts

### To change schema:
1. Create new migration in `supabase/migrations/`
2. Use next sequential number (00011, 00012, etc.)
3. Test locally first
4. Apply to production
5. Never modify existing migrations

## Clean Root Directory

The root directory is now clean of SQL files. All SQL is organized in `supabase/` folder where it belongs.

## Need Help?

- Check the README in each folder for specific guidance
- Migration guidelines: `supabase/migrations/README.md`
- Diagnostic guide: `supabase/diagnostics/README.md`
- Fix guide: `supabase/fixes/README.md`
- Main guide: `supabase/README.md`
