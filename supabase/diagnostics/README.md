# Diagnostic SQL Scripts

This folder contains SQL scripts for diagnosing and checking the database state.

## Files

### `check_schema.sql`
- **Purpose**: Verify database schema structure
- **When to use**: After migrations to ensure tables and columns exist
- **Output**: List of tables, columns, and their types

### `check_policies.sql`
- **Purpose**: Quick check of RLS policies
- **When to use**: When debugging permission issues
- **Output**: Count of policies per table

### `check_policies_detailed.sql`
- **Purpose**: Detailed view of all RLS policies
- **When to use**: When you need to see exact policy definitions
- **Output**: Full policy details including conditions

### `diagnose_admin.sql`
- **Purpose**: Diagnose admin user permissions
- **When to use**: When admin features aren't working
- **Output**: Admin user details and permissions

## How to Use

1. Open Supabase SQL Editor
2. Copy and paste the contents of the desired script
3. Run the query
4. Review the output to diagnose issues

## Notes

- These scripts are read-only (SELECT queries only)
- Safe to run at any time
- Do not modify database state
