# 1-on-1 Tracking Platform - Setup Guide

## MVP (Phases 1-4) Complete! ✅

You now have a fully functional foundation with authentication, database schema, security, and core 1-on-1 management logic.

---

## What's Been Built

### Phase 1: Foundation ✅
- Next.js 15 with TypeScript and App Router
- Tailwind CSS with shadcn/ui design tokens
- Supabase client utilities (client, server, middleware)
- Google Workspace OAuth authentication
- Protected routes and navigation

### Phase 2: Database & Security ✅
- **8 database tables** with relationships
- **Row Level Security (RLS)** on all tables
- **Role-based access control** (Admin, Manager, Developer)
- **Team-scoped access** enforcement
- Comprehensive security policies

### Phase 3: Identity & User Context ✅
- Auto-sync from `auth.users` to `app_users`
- User role management (admin, manager, developer)
- Team assignment
- TypeScript types for all database entities
- Helper functions for user context

### Phase 4: Core 1-on-1 Logic ✅
- Auto-create monthly 1-on-1 records
- Prevent duplicate 1-on-1s per month
- Status management (draft → completed)
- Developer and manager workflows
- Validation logic

---

## Next Steps: Run Database Migrations

### 1. Open Supabase SQL Editor

Go to: https://obuwzjvhxpubtjrvjgfh.supabase.co/project/default/sql/new

### 2. Run Migrations in Order

Run each file from the `supabase/migrations/` directory:

#### ① Initial Schema
```sql
-- Copy and run: supabase/migrations/00001_initial_schema.sql
```
Creates all tables, enums, indexes, triggers, and helper functions.

#### ② Row Level Security
```sql
-- Copy and run: supabase/migrations/00002_row_level_security.sql
```
Enables RLS and creates security policies for all tables.

#### ③ Seed Data (Optional)
```sql
-- Copy and run: supabase/migrations/00003_seed_data.sql
```
Adds sample teams and company-wide questions for testing.

#### ④ User Sync Trigger
```sql
-- Copy and run: supabase/migrations/00004_user_sync_trigger.sql
```
Auto-syncs authenticated users to app_users table.

---

## 3. Create Your First Admin

After you log in for the first time, run this in Supabase SQL Editor:

```sql
SELECT promote_to_admin('your-email@company.com');
```

This promotes your user to admin role, giving you full access.

---

## 4. Create Teams and Assign Users

### Create a team:
```sql
INSERT INTO teams (name) VALUES ('Engineering - Frontend');
```

### Promote someone to manager and assign them to the team:
```sql
SELECT promote_to_manager(
  'manager-email@company.com',
  (SELECT id FROM teams WHERE name = 'Engineering - Frontend')
);
```

### Assign developers to a team:
```sql
SELECT assign_to_team(
  'developer-email@company.com',
  (SELECT id FROM teams WHERE name = 'Engineering - Frontend')
);
```

---

## Current Project Structure

```
jobins-one-on-one-tracking/
├── app/
│   ├── actions/
│   │   └── auth.ts                    # Auth server actions
│   ├── auth/
│   │   └── callback/route.ts          # OAuth callback
│   ├── dashboard/
│   │   └── page.tsx                   # Protected dashboard
│   ├── layout.tsx                     # Root layout
│   ├── page.tsx                       # Landing/login page
│   └── globals.css                    # Global styles
├── lib/
│   ├── auth/
│   │   └── user-context.ts            # User context helpers
│   ├── one-on-ones/
│   │   └── management.ts              # 1-on-1 management logic
│   ├── supabase/
│   │   ├── client.ts                  # Browser client
│   │   ├── server.ts                  # Server client
│   │   └── middleware.ts              # Middleware client
│   └── types/
│       └── database.ts                # TypeScript types
├── supabase/
│   └── migrations/
│       ├── 00001_initial_schema.sql
│       ├── 00002_row_level_security.sql
│       ├── 00003_seed_data.sql
│       └── 00004_user_sync_trigger.sql
├── middleware.ts                      # Session refresh middleware
├── .env.local                         # Environment variables
└── package.json
```

---

## Database Schema

### Core Tables:

| Table | Description |
|-------|-------------|
| `teams` | Engineering teams with managers |
| `app_users` | Extended user profiles (role, team) |
| `one_on_ones` | Monthly 1-on-1 session records |
| `questions` | Question bank (company/team) |
| `answers` | Developer & manager responses |
| `notes` | Free-form notes and feedback |
| `action_items` | Follow-up tasks |
| `metrics_snapshots` | Monthly metrics for trends |

### Security Model:

- **Admins**: Full access to everything
- **Managers**: Team-scoped access, can manage their team's 1-on-1s
- **Developers**: Can only view/edit their own 1-on-1s

---

## What's Next?

Now that the MVP foundation is complete, you can:

### Option A: Build the UI (Phases 6-7)
- Developer experience (monthly checklist, answer questions, view history)
- Manager experience (team dashboard, provide feedback, action items)

### Option B: Extend the Backend (Phase 5)
- Implement question management UI
- Add answer collection workflows
- Build metrics calculation

### Option C: Test the Current Setup
1. Run the migrations
2. Create an admin user
3. Set up a team
4. Test the authentication flow
5. Verify RLS policies work correctly

---

## Commands

```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint
```

---

## Environment Variables

Your [.env.local](.env.local) file is already configured with:

- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Public anon key
- `NEXT_PUBLIC_SITE_URL` - Site URL for OAuth redirects
- `NEXT_PUBLIC_GOOGLE_WORKSPACE_DOMAIN` - (Optional) Restrict to company domain

---

## Helpful Resources

- **Supabase Dashboard**: https://obuwzjvhxpubtjrvjgfh.supabase.co
- **Database Schema**: [supabase/migrations/README.md](supabase/migrations/README.md)
- **Next.js Docs**: https://nextjs.org/docs
- **Supabase Docs**: https://supabase.com/docs

---

## Need Help?

If you encounter any issues:
1. Check the browser console for errors
2. Check Supabase logs in the dashboard
3. Verify RLS policies are working
4. Ensure all migrations ran successfully

Ready to continue building? Let me know which phase you'd like to tackle next!
