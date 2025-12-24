# Multi-Team Support Implementation Guide

## Overview
Users can now be assigned to multiple teams instead of just one. This implementation uses a junction table pattern for many-to-many relationships.

## Database Changes

### New Table: `user_teams`
```sql
CREATE TABLE user_teams (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES app_users(id),
    team_id UUID REFERENCES teams(id),
    created_at TIMESTAMPTZ,
    UNIQUE(user_id, team_id)
);
```

### Migration File
Location: `supabase/migrations/00010_multi_team_support.sql`

**IMPORTANT**: You must apply this migration to your Supabase database:

```bash
# If using Supabase CLI locally
supabase db reset

# OR apply the specific migration on your hosted Supabase:
# Go to Supabase Dashboard > SQL Editor > Run the migration file
```

## Changes Made

### 1. API Endpoints Updated

**File**: `app/api/admin/users/[userId]/route.ts`

- **PATCH endpoint**: Now accepts `team_ids` (array) instead of `team_id`
- **GET endpoint**: Returns `team_ids` array
- Handles bulk team assignment/removal

**Request Example**:
```json
{
  "role": "developer",
  "team_ids": ["team-uuid-1", "team-uuid-2", "team-uuid-3"]
}
```

**Response Example**:
```json
{
  "success": true,
  "data": {
    "id": "user-uuid",
    "email": "user@example.com",
    "role": "developer",
    "team_ids": ["team-uuid-1", "team-uuid-2"]
  }
}
```

### 2. Dashboard Queries Updated

**File**: `app/dashboard/page.tsx`

- `getAllUsers()`: Now fetches user teams from `user_teams` table
- `getTeamMembersWithOneOnOnes()`: Uses junction table to get team members
- Returns users with `team_ids` array instead of single `team_id`

### 3. UI Components Updated

**File**: `components/admin/user-management-row.tsx`

**Changes**:
- Multi-select checkbox interface for team assignment
- Displays multiple teams as chips/tags in view mode
- State management updated to handle arrays

**Features**:
- Check/uncheck teams individually
- Shows count of selected teams
- Scrollable list when many teams exist
- Visual team chips with team names

### 4. Database Helpers

Two new SQL functions created:

```sql
-- Get all teams a user belongs to
SELECT * FROM get_user_teams('user-uuid');

-- Get all members of a team
SELECT * FROM get_team_members('team-uuid');
```

## UI Changes

### Admin User Management
- **Before**: Single dropdown to select one team
- **After**: Checkbox list to select multiple teams

### View Mode
- **Before**: Shows single team name or "-"
- **After**: Shows multiple team chips/badges

### Edit Mode
- Checkboxes with team names
- Scroll support for many teams
- Selected count indicator

## RLS Policies

Added comprehensive Row Level Security policies for `user_teams`:

- Users can view their own team memberships
- Admins can view all team memberships
- Managers can view their team memberships
- Only admins can insert/update/delete team memberships

## Migration Steps

### 1. Backup Current Data
```sql
-- Backup current team assignments
SELECT id, email, team_id
FROM app_users
WHERE team_id IS NOT NULL;
```

### 2. Apply Migration
Run the migration file `00010_multi_team_support.sql`

The migration automatically:
- Creates `user_teams` table
- Migrates existing `team_id` data to `user_teams`
- Removes `team_id` column from `app_users`
- Adds RLS policies
- Creates helper functions

### 3. Verify Migration
```sql
-- Check user_teams table
SELECT COUNT(*) FROM user_teams;

-- Check a specific user's teams
SELECT ut.*, t.name as team_name
FROM user_teams ut
JOIN teams t ON t.id = ut.team_id
WHERE ut.user_id = 'some-user-uuid';
```

### 4. Test UI
1. Go to Admin Dashboard
2. Click "Edit" on a user
3. You should see checkboxes for team selection
4. Select multiple teams
5. Save and verify teams are displayed as chips

## Breaking Changes

### Code Changes Required

If you have custom code that references `user.team_id`, update it to use `user.team_ids`:

**Before**:
```typescript
const teamId = user.team_id;
const hasTeam = !!user.team_id;
```

**After**:
```typescript
const teamIds = user.team_ids || [];
const hasTeams = teamIds.length > 0;
const firstTeamId = teamIds[0]; // if you need a single team
```

### API Changes

**Before**:
```json
{
  "team_id": "uuid"
}
```

**After**:
```json
{
  "team_ids": ["uuid1", "uuid2"]
}
```

## Common Scenarios

### Assign user to multiple teams
```typescript
await fetch(`/api/admin/users/${userId}`, {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    team_ids: ['team-1-uuid', 'team-2-uuid', 'team-3-uuid']
  })
});
```

### Remove user from all teams
```typescript
await fetch(`/api/admin/users/${userId}`, {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    team_ids: []
  })
});
```

### Get user's teams
```sql
SELECT t.*
FROM user_teams ut
JOIN teams t ON t.id = ut.team_id
WHERE ut.user_id = 'user-uuid';
```

## Rollback Instructions

If you need to rollback this migration:

```sql
-- 1. Add team_id column back
ALTER TABLE app_users ADD COLUMN team_id UUID REFERENCES teams(id);

-- 2. Migrate first team back (if users had multiple, only first is kept)
UPDATE app_users u
SET team_id = (
  SELECT team_id
  FROM user_teams
  WHERE user_id = u.id
  LIMIT 1
);

-- 3. Drop user_teams table and functions
DROP TABLE user_teams;
DROP FUNCTION get_user_teams;
DROP FUNCTION get_team_members;
```

## Next Steps

1. Apply the migration
2. Test user management in admin dashboard
3. Update any custom code that uses `team_id`
4. Consider updating analytics queries (if using team filtering)

## Support

If you encounter issues:
1. Check Supabase logs for migration errors
2. Verify RLS policies are applied
3. Check browser console for API errors
4. Verify user_teams table has data
