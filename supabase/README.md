# Supabase SQL Organization

This folder contains all SQL scripts organized by purpose.

## Folder Structure

```
supabase/
├── migrations/          # Database migrations (run in order)
│   ├── README.md
│   ├── 00001_initial_schema.sql
│   ├── 00002_row_level_security.sql
│   └── ...
├── diagnostics/         # Diagnostic/check scripts (read-only)
│   ├── README.md
│   ├── check_schema.sql
│   ├── check_policies.sql
│   └── ...
└── fixes/              # One-time fix scripts (write operations)
    ├── README.md
    └── fix_rls_policies_final.sql
```

## Quick Reference

### Need to check database state?
→ Use scripts in `diagnostics/`

### Need to fix a specific issue?
→ Use scripts in `fixes/`

### Need to make permanent schema changes?
→ Create a new migration in `migrations/`

## Common Tasks

### Check if migration was applied
```sql
-- In diagnostics/check_schema.sql
SELECT table_name, column_name
FROM information_schema.columns
WHERE table_schema = 'public';
```

### Diagnose permission issues
```sql
-- Run diagnostics/check_policies_detailed.sql
```

### Fix RLS recursion errors
```sql
-- Run fixes/fix_rls_policies_final.sql
```

### Apply new schema changes
```bash
# Create new migration
supabase migration new your_feature_name
# Edit the generated file
# Apply it
supabase migration up
```

## File Naming Conventions

### Migrations
- Format: `XXXXX_description.sql`
- Example: `00011_add_analytics_tables.sql`
- Numbers are sequential, 5 digits, zero-padded

### Diagnostics
- Format: `check_thing.sql` or `diagnose_thing.sql`
- Example: `check_schema.sql`, `diagnose_admin.sql`
- Lowercase with underscores

### Fixes
- Format: `fix_problem_name.sql`
- Example: `fix_rls_policies_final.sql`
- Lowercase with underscores
- Add version suffix if multiple versions exist

## Guidelines

### When to create a migration?
- Adding/removing tables
- Adding/removing columns
- Changing data types
- Modifying indexes
- Updating RLS policies permanently
- Any permanent schema change

### When to create a diagnostic script?
- Need to check if something exists
- Debugging permissions
- Verifying data integrity
- Regular health checks

### When to create a fix script?
- One-time data correction
- Fixing a specific production issue
- Temporary workaround
- Emergency repairs

## Best Practices

1. **Read-only in diagnostics**: Never modify data in diagnostic scripts
2. **Test fixes locally**: Always test fix scripts on local/staging first
3. **Document everything**: Add comments explaining what and why
4. **Version control**: Commit all SQL files to git
5. **Backup before fixes**: Always backup before running fix scripts
6. **READMEs**: Keep folder READMEs up to date

## Getting Help

- Check folder-specific READMEs for details
- Review migration comments for context
- Look at similar existing scripts as examples
- Test on local database first
