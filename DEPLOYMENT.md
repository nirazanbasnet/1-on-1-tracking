# 1-on-1 Tracking Platform - Deployment Guide

## Overview

This is a comprehensive 1-on-1 tracking platform built with Next.js 15, Supabase, and TypeScript. It enables managers and developers to conduct structured monthly 1-on-1 meetings with features like questionnaires, action items, metrics tracking, and notifications.

## Features Completed

### Phase 1-4: Core Foundation ✅
- Next.js 15 with App Router
- Supabase authentication with Google OAuth
- PostgreSQL database with Row Level Security (RLS)
- Role-based access control (Admin, Manager, Developer)
- Team management and user organization

### Phase 5: Question & Feedback System ✅
- Dynamic questionnaire system
- Rating and text-based questions
- Two-way feedback (developer self-assessment + manager review)
- Notes and additional feedback sections

### Phase 6: Action Items & Follow-ups ✅
- Create and assign action items
- Status tracking (pending/in progress/completed)
- Due date management with overdue indicators
- Dashboard widget showing pending items

### Phase 7: Analytics & Metrics ✅
- Automatic metrics calculation on completion
- Developer progress tracking with trend charts
- Team-wide analytics for managers
- Rating alignment scoring
- Historical performance data

### Phase 8: Notifications & Reminders ✅
- In-app notification center with real-time updates
- Database triggers for automatic notifications
- Event-based notifications (submission, review, completion)
- Action item reminders (due soon, overdue)
- Email notification templates (requires email service setup)

### Phase 9: Advanced Features ✅
- Team-specific question management
- Bulk operations (create multiple 1-on-1s, send reminders)
- Data export functionality
- Question templates and presets

### Phase 10: Polish & Performance ✅
- Loading skeleton components
- Error handling patterns
- Optimized database queries
- Responsive design

## Prerequisites

- Node.js 18+ and npm
- Supabase account
- Google Cloud Console project (for OAuth)
- Email service account (optional, for email notifications)

## Database Setup

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for the database to initialize
3. Note your project URL and anon key

### 2. Run Migrations

Apply all migrations in order from the `supabase/migrations/` directory:

1. `00001_initial_schema.sql` - Base schema
2. `00002_row_level_security.sql` - RLS policies
3. `00003_seed_data.sql` - Initial data
4. `00004_user_sync_trigger.sql` - Auth sync
5. `00005_fix_rls_recursion.sql` - RLS fix
6. `00006_update_schema_for_phase_5_6.sql` - Schema updates
7. `00007_notifications.sql` - Notification system

**Important:** Run migration `00006` carefully as it modifies existing columns and RLS policies.

### 3. Set up Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials:
   - Application type: Web application
   - Authorized redirect URIs: `https://your-project.supabase.co/auth/v1/callback`
5. Copy Client ID and Client Secret
6. In Supabase Dashboard:
   - Go to Authentication > Providers
   - Enable Google
   - Paste Client ID and Secret
   - Set user type to "External" (to allow personal Gmail accounts)

## Application Setup

### 1. Environment Variables

Create a `.env.local` file:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Optional: Email Service (example with Resend)
# RESEND_API_KEY=your-resend-api-key
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Initial Setup After Deployment

### 1. First User Setup

1. Sign in with Google
2. The first user will be created with 'developer' role
3. Manually update in Supabase to make them an admin:
   ```sql
   UPDATE app_users
   SET role = 'admin'
   WHERE email = 'your-email@example.com';
   ```

### 2. Create Teams

As an admin:
1. Go to Dashboard
2. Create teams in the "Team Management" section
3. Assign managers to teams

### 3. Add Questions

Add company-wide questions in the Questions section:
- Use different question types (rating_1_5, rating_1_10, text)
- Set sort order for question display
- Mark questions as active/inactive

### 4. Assign Users to Teams

1. View all users in the dashboard
2. Edit each user's team assignment
3. Update roles as needed (admin/manager/developer)

## Email Notifications (Optional)

### Using Resend

1. Sign up at [resend.com](https://resend.com)
2. Get your API key
3. Add to environment: `RESEND_API_KEY=your-key`
4. Uncomment the Resend implementation in `lib/email/notifications.ts`
5. Install package: `npm install resend`
6. Verify your domain in Resend dashboard

### Using SendGrid or other services

Update the `sendEmail` function in `lib/email/notifications.ts` to use your preferred service.

## Scheduled Tasks (Optional)

For automated reminders and overdue notifications, set up cron jobs or scheduled functions:

### Option 1: Vercel Cron Jobs

Create `vercel.json`:
```json
{
  "crons": [{
    "path": "/api/cron/check-overdue",
    "schedule": "0 9 * * *"
  }]
}
```

### Option 2: Supabase Edge Functions

Use Supabase Edge Functions with cron triggers to run:
- `checkAndNotifyOverdueActionItems()`
- `checkAndNotifyDueSoonActionItems()`
- Bulk reminder sending

## Deployment

### Deploy to Vercel

```bash
npm install -g vercel
vercel
```

Or connect your GitHub repository to Vercel for automatic deployments.

### Environment Variables in Production

Set all environment variables in your hosting platform:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_SITE_URL` (your production domain)
- Email service keys (if enabled)

## Performance Optimization

### Database Indexes

All necessary indexes are created by the migrations. Monitor slow queries in Supabase dashboard.

### Caching

- Server components are cached by default
- Use `revalidatePath()` after mutations
- Consider adding React Query for client-side caching

### Bundle Size

```bash
npm run build
npm run analyze  # If you add @next/bundle-analyzer
```

## Security Checklist

- ✅ Row Level Security (RLS) enabled on all tables
- ✅ Input validation in server actions
- ✅ Role-based access control
- ✅ Authentication required for all routes
- ⚠️ Consider adding rate limiting for production
- ⚠️ Enable CSRF protection
- ⚠️ Add Content Security Policy headers

## Monitoring & Maintenance

### Health Checks

- Monitor Supabase dashboard for errors
- Check database query performance
- Monitor API response times

### Regular Maintenance

- Review and archive old 1-on-1 data
- Clean up old notifications
- Update dependencies regularly
- Back up database periodically

## Troubleshooting

### Common Issues

**Google OAuth not working:**
- Check redirect URI matches exactly
- Verify user type is set to "External"
- Clear browser cache and cookies

**RLS Policy errors:**
- Check migration 00006 was applied correctly
- Verify user is in app_users table
- Check is_admin() function exists

**Notifications not appearing:**
- Verify migration 00007 was applied
- Check database triggers are active
- Look for errors in Supabase logs

**Metrics not calculating:**
- Ensure 1-on-1 status is "completed"
- Check metrics_snapshots table for errors
- Verify answers exist for the 1-on-1

## Support & Contribution

For issues or questions:
1. Check this deployment guide
2. Review code comments
3. Check Supabase logs
4. Review database constraints and RLS policies

## License

[Your License Here]

## Credits

Built with:
- Next.js 15
- Supabase
- TypeScript
- Tailwind CSS
