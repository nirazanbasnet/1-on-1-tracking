# Quick Reset Checklist

Use this as a quick reference while following `FRESH_START_GUIDE.md`.

## 🗑️ Phase 1: Clean Slate (5 min)

- [ ] Open Supabase SQL Editor
- [ ] Run the "Drop All Tables" script from guide
- [ ] Verify tables are gone: `SELECT tablename FROM pg_tables WHERE schemaname = 'public';`
- [ ] Should return empty

## 📦 Phase 2: Apply Migrations (10-15 min)

Copy and run each file in order:

- [ ] `supabase/migrations/00001_initial_schema.sql`
- [ ] `supabase/migrations/00002_row_level_security.sql`
- [ ] `supabase/migrations/00003_seed_data.sql`
- [ ] `supabase/migrations/00004_user_sync_trigger.sql`
- [ ] `supabase/migrations/00005_fix_rls_recursion.sql`
- [ ] `supabase/migrations/00006_update_schema_for_phase_5_6_safe.sql`
- [ ] `supabase/migrations/00007_notifications_safe.sql`
- [ ] `supabase/migrations/00008_fix_user_update_policy.sql`
- [ ] `supabase/migrations/00009_remove_restrictive_policy.sql`
- [ ] **Modified** 00010 (see guide - fresh install version)
- [ ] `supabase/fixes/fix_rls_policies_final.sql`

## 👥 Phase 3: Create Users (5-10 min)

### In Supabase Dashboard → Authentication → Users:

- [ ] Create admin: `admin@example.com` / password of choice
- [ ] Create manager: `manager@example.com` / password of choice
- [ ] Create dev1: `developer1@example.com` / password of choice
- [ ] Create dev2: `developer2@example.com` / password of choice

### In SQL Editor:

- [ ] Get all user IDs: `SELECT id, email FROM auth.users;`
- [ ] Copy the user IDs (you'll need them)

## 🏢 Phase 4: Setup Teams & Roles (5 min)

- [ ] Create teams (run script from guide)
- [ ] Update user roles (run script from guide - replace UUIDs)
- [ ] Assign manager to team
- [ ] Assign developers to team via user_teams
- [ ] Verify: Run the verification query from guide

## ✅ Phase 5: Verify (2 min)

- [ ] Check tables count query - should show data
- [ ] Check RLS policies - should show ~15+ policies
- [ ] Restart dev server: `npm run dev`

## 🧪 Phase 6: Test (5 min)

- [ ] Login as admin → See admin dashboard ✓
- [ ] Login as manager → See Engineering team ✓
- [ ] Login as developer → See dashboard ✓
- [ ] Manager can create 1-on-1 ✓

---

## Expected Timeline

- **Total Time**: 30-40 minutes
- **Longest Part**: Applying migrations (copying and pasting)
- **Fastest Part**: Creating users via UI

## Quick SQL Snippets

### Check Progress
```sql
-- See what tables exist
SELECT tablename FROM pg_tables WHERE schemaname = 'public';

-- See data counts
SELECT 'users' as table_name, COUNT(*) FROM app_users
UNION ALL SELECT 'teams', COUNT(*) FROM teams
UNION ALL SELECT 'user_teams', COUNT(*) FROM user_teams;
```

### Get User IDs
```sql
SELECT id, email FROM auth.users ORDER BY email;
```

### Verify Team Assignments
```sql
SELECT u.email, t.name as team
FROM app_users u
JOIN user_teams ut ON ut.user_id = u.id
JOIN teams t ON t.id = ut.team_id
ORDER BY u.email, t.name;
```

---

## If Something Goes Wrong

1. **Stop immediately**
2. **Don't panic**
3. **Check which step failed**
4. **Refer to FRESH_START_GUIDE.md troubleshooting**
5. **Can always start over - that's the point of a fresh start!**

---

## After Successful Reset

- [ ] Update `README_PROJECT_STATUS.md` with new setup date
- [ ] Document any custom data you added
- [ ] Create your first real 1-on-1 to test workflow
- [ ] Celebrate! 🎉

---

**Current Step**: _____________

**Started At**: _____________

**Completed At**: _____________

**Issues Encountered**:
-
-
-

**Notes**:
-
-
-
