# Database Migrations

This folder contains numbered database migrations that run in order.

## Naming Convention

Migrations follow this pattern:
```
XXXXX_description.sql
```

Where:
- `XXXXX` is a sequential number (00001, 00002, etc.)
- `description` is a snake_case description of what the migration does

## Migration List

### `00001_initial_schema.sql`
- Creates all base tables (users, teams, questions, answers, one_on_ones)
- Sets up initial database structure

### `00002_row_level_security.sql`
- Enables RLS on all tables
- Creates initial security policies
- Sets up role-based access control

### `00003_seed_data.sql`
- Inserts initial seed data
- Creates default questions
- Sets up test data for development

### `00004_user_sync_trigger.sql`
- Creates trigger to sync auth.users with app_users
- Automatically creates app_user record when auth user signs up

### `00005_fix_rls_recursion.sql`
- First attempt at fixing RLS recursion issues
- Simplified some policies

### `00006_update_schema_for_phase_5_6_safe.sql`
- Adds columns for phases 5 and 6 features
- Updates schema for new functionality

### `00007_notifications_safe.sql`
- Creates notifications table
- Sets up notification system

### `00008_fix_user_update_policy.sql`
- Fixes user update permissions
- Allows users to update their own profiles

### `00009_remove_restrictive_policy.sql`
- Removes overly restrictive policies
- Improves user experience

### `00010_multi_team_support_fixed.sql`
- **MAJOR MIGRATION**: Enables multi-team support
- Creates `user_teams` junction table
- Migrates data from `app_users.team_id` to `user_teams`
- Removes `team_id` column from `app_users`
- Updates all affected policies

## How Migrations Work

1. Migrations run in numerical order (00001, then 00002, etc.)
2. Each migration should be idempotent (safe to run multiple times)
3. Use `IF EXISTS` / `IF NOT EXISTS` clauses
4. Never delete or modify existing migrations
5. Always create a new migration for schema changes

## Running Migrations

### In Development (Supabase CLI)
```bash
supabase migration up
```

### In Production (Supabase Dashboard)
1. Go to SQL Editor
2. Copy migration contents
3. Run the SQL
4. Mark as applied in your tracking system

## Creating a New Migration

1. Create a new file with the next number:
   ```bash
   touch supabase/migrations/00011_your_description.sql
   ```

2. Write your migration SQL:
   ```sql
   -- Description of what this migration does

   -- Step 1: ...
   CREATE TABLE IF NOT EXISTS ...

   -- Step 2: ...
   ALTER TABLE ...
   ```

3. Test locally:
   ```bash
   supabase db reset  # Runs all migrations from scratch
   ```

4. Commit to version control

## Best Practices

- ✅ Use transactions where appropriate
- ✅ Add comments explaining what each step does
- ✅ Test migrations on a copy of production data
- ✅ Make migrations reversible when possible
- ✅ Use `IF EXISTS` / `IF NOT EXISTS` for safety
- ❌ Never modify existing migrations
- ❌ Don't delete old migrations
- ❌ Avoid migrations that take too long (split them up)

## Rollback Strategy

If a migration fails:
1. Don't panic
2. Check Supabase logs for the error
3. Fix the issue in a new migration (don't modify the failed one)
4. Create a rollback migration if needed (00011_rollback_feature_x.sql)
