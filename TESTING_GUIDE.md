# Testing Guide - 1-on-1 Tracking Platform

Complete testing scenarios for all features across different user roles.

---

## Initial Setup

### 1. Run Remaining Migration

First, run the notifications migration:
```sql
-- File: supabase/migrations/00007_notifications.sql
-- Copy and paste the entire file into Supabase SQL Editor
```

### 2. Create Test Users

Sign in with 3 different Google accounts to create:
1. **Admin User** (your main account)
2. **Manager User** (test manager account)
3. **Developer User** (test developer account)

### 3. Set Up Admin User

In Supabase SQL Editor:
```sql
-- Make your account an admin
UPDATE app_users
SET role = 'admin'
WHERE email = 'your-admin-email@gmail.com';
```

---

## Test Scenario 1: Admin Setup

**User:** Admin
**Goal:** Set up the platform structure

### Steps:

1. **Sign in as Admin**
   - Navigate to `/dashboard`
   - Verify you see "Admin View" with stats cards

2. **Create a Team**
   - In Team Management section, click "Add Team"
   - Create team: "Engineering Team"
   - Assign the manager user as team manager
   - **Expected:** Team appears in the list

3. **Create Company Questions**
   - Click on Questions management
   - Add company-wide questions:
     ```
     Q1: "How satisfied are you with your current projects?" (Rating 1-5)
     Q2: "What are your top 3 achievements this month?" (Text)
     Q3: "How would you rate your work-life balance?" (Rating 1-5)
     Q4: "What support do you need from your manager?" (Text)
     Q5: "Are you on track with your goals?" (Rating 1-5)
     ```
   - **Expected:** All questions marked as active

4. **Assign Users to Team**
   - In Users table, edit the developer user
   - Set team to "Engineering Team"
   - Set role to "developer"
   - **Expected:** Developer now appears under Engineering Team

---

## Test Scenario 2: Manager Workflow

**User:** Manager
**Goal:** Create 1-on-1s, view team analytics, manage action items

### Phase 1: Initial Setup

1. **Sign in as Manager**
   - Navigate to `/dashboard`
   - **Expected:** See Manager View with:
     - Pending Action Items widget (empty)
     - Team Analytics widget (empty)
     - Team 1-on-1s list

2. **Create Bulk 1-on-1s**
   - Use bulk operations (if UI exists) or manually create
   - Create 1-on-1 for current month (e.g., "2024-12")
   - **Expected:** Draft 1-on-1 created for developer

3. **Send Reminder**
   - Use bulk reminder feature
   - **Expected:** Notification sent to developer

### Phase 2: Review Developer Submission

1. **Wait for Developer to Submit** (see Scenario 3)

2. **Receive Notification**
   - Click bell icon in nav bar
   - **Expected:** Notification "Developer has submitted their 1-on-1"
   - Click notification
   - **Expected:** Navigate to 1-on-1 detail page

3. **Review Developer's Answers**
   - View all developer's self-assessment ratings
   - Read their notes and achievements
   - **Expected:** All developer answers visible, marked read-only

4. **Provide Manager Feedback**
   - Rate each question from manager's perspective
   - Add manager notes
   - **Expected:** Can input ratings and text

5. **Create Action Items**
   - Click "+ Add Action Item" in Action Items section
   - Create action items:
     ```
     - "Complete React training course" (Developer, Due: 2 weeks)
     - "Schedule architecture review meeting" (Manager, Due: 1 week)
     - "Update documentation for new API" (Developer, Due: 3 weeks)
     ```
   - **Expected:** Action items appear with proper assignment

6. **Mark as Completed**
   - Click "Complete Review" button
   - **Expected:**
     - Status changes to "completed"
     - Notification sent to developer
     - Metrics automatically calculated
     - Both users receive completion notifications

### Phase 3: View Analytics

1. **Check Team Analytics Widget**
   - Return to `/dashboard`
   - **Expected:**
     - Team average score displayed
     - Developer's score shown
     - Trend indicator (if multiple 1-on-1s exist)

2. **Monitor Action Items**
   - Check Pending Action Items widget
   - **Expected:** Action item assigned to manager visible
   - Update status to "in_progress"
   - **Expected:** Widget updates immediately

---

## Test Scenario 3: Developer Workflow

**User:** Developer
**Goal:** Complete self-assessment, view progress, manage action items

### Phase 1: Complete Self-Assessment

1. **Sign in as Developer**
   - Navigate to `/dashboard`
   - **Expected:** See Developer View with:
     - Pending Action Items widget (empty initially)
     - Your Progress widget (empty initially)
     - My 1-on-1s list with draft status

2. **Receive Reminder Notification**
   - Click bell icon
   - **Expected:** "Don't forget to complete your 1-on-1" notification
   - Mark as read

3. **Open 1-on-1**
   - Click on current month's 1-on-1
   - **Expected:** See form with all company questions

4. **Complete Self-Assessment**
   - Answer all rating questions (1-5)
   - Provide text responses
   - Example ratings:
     ```
     Q1: 4/5 - Satisfied with projects
     Q2: "Completed user auth feature, optimized database queries, mentored junior dev"
     Q3: 3/5 - Could be better
     Q4: "Need more context on Q2 priorities"
     Q5: 4/5 - On track
     ```
   - Add developer notes: "Overall good month, would like to discuss career growth"

5. **Save Draft**
   - Click "Save Draft"
   - **Expected:** Success message appears
   - Refresh page
   - **Expected:** All answers preserved

6. **Submit to Manager**
   - Click "Submit to Manager"
   - **Expected:**
     - Status changes to "submitted"
     - Form becomes read-only
     - Notification sent to manager
     - Redirect to dashboard

### Phase 2: View Manager Feedback

1. **Wait for Manager Review** (see Scenario 2)

2. **Receive Notification**
   - Bell icon shows new notification
   - **Expected:** "Your 1-on-1 has been completed"
   - Click notification

3. **View Manager Feedback**
   - See manager's ratings side-by-side with yours
   - Read manager feedback notes
   - **Expected:**
     - Both ratings visible
     - Rating alignment shown
     - Manager notes visible

4. **Review Action Items**
   - Scroll to Action Items section
   - **Expected:**
     - See all action items
     - Items assigned to you highlighted
     - Due dates visible

### Phase 3: Progress Tracking

1. **Check Progress Widget**
   - Return to `/dashboard`
   - **Expected:**
     - Latest score displayed
     - Self-rating vs Manager rating shown
     - Alignment indicator
     - Trend chart (if multiple 1-on-1s exist)

2. **Manage Action Items**
   - In Pending Action Items widget
   - **Expected:** Your assigned action items visible
   - Update "Complete React training" to "in_progress"
   - **Expected:** Status updates, overdue badge if past due

---

## Test Scenario 4: Notifications System

**Test all notification types**

### 1. Status Change Notifications

- **Trigger:** Developer submits 1-on-1
- **Expected:** Manager receives "1-on-1 Submitted for Review" notification
- **Icon:** Blue document icon

- **Trigger:** Manager reviews 1-on-1
- **Expected:** Developer receives "1-on-1 Reviewed" notification
- **Icon:** Blue document icon

- **Trigger:** Manager completes 1-on-1
- **Expected:** Both receive "1-on-1 Completed" notifications
- **Icon:** Blue document icon

### 2. Action Item Notifications

- **Trigger:** Create new action item
- **Expected:** Assignee receives "New Action Item Assigned"
- **Icon:** Green clipboard icon

- **Trigger:** Action item due in 3 days (requires admin check)
- **Expected:** "Action Item Due Soon" notification
- **Icon:** Yellow clock icon

- **Trigger:** Action item overdue (requires admin check)
- **Expected:** "Action Item Overdue" notification
- **Icon:** Red warning icon

### 3. Notification Features

- **Mark as Read:** Click notification
  - **Expected:** Blue dot disappears, count decreases

- **Delete:** Click "Delete" on notification
  - **Expected:** Notification removed from list

- **Mark All as Read:** Click "Mark all as read"
  - **Expected:** All notifications marked read, count = 0

- **Navigation:** Click notification with link
  - **Expected:** Navigate to related 1-on-1

---

## Test Scenario 5: Analytics & Metrics

**Goal:** Verify automatic metrics calculation and display

### Prerequisites
- Complete at least 2 months of 1-on-1s for better trend data

### Developer Analytics

1. **Complete Multiple 1-on-1s**
   - Do 2-3 months of 1-on-1s with varying scores
   - **Expected:** Each completion triggers metrics calculation

2. **View Progress Widget**
   - Check latest score
   - **Expected:** Accurate average of ratings

3. **View Trend Chart**
   - **Expected:**
     - Line chart showing score over time
     - Points for each month
     - X-axis with month labels

4. **Check Alignment**
   - **Expected:**
     - Shows difference between self and manager ratings
     - Color-coded (green=excellent, red=needs attention)

### Manager Analytics

1. **View Team Analytics**
   - Check team average
   - **Expected:** Average of all team members' scores

2. **View Team Members List**
   - **Expected:**
     - Each member shows latest score
     - Color-coded badges
     - Individual scores visible

3. **Check Trends**
   - **Expected:** Team trend shows improvement/decline

---

## Test Scenario 6: Bulk Operations

**User:** Manager or Admin

### Create Bulk 1-on-1s

Using the bulk operations action:
```typescript
// This would be called from UI or API
await createBulkOneOnOnesForTeam('2025-01');
```

**Expected:**
- Creates 1-on-1s for all team members
- Skips existing ones
- Returns count of created vs skipped

### Send Bulk Reminders

```typescript
await sendBulkReminders('2025-01');
```

**Expected:**
- Sends notifications to developers with draft status
- Returns count of reminders sent

### Export Data

```typescript
await exportOneOnOneData('2024-01', '2024-12');
```

**Expected:**
- Returns all 1-on-1 data with answers, notes, action items
- Filtered by team (for managers)
- All data (for admins)

---

## Test Scenario 7: Edge Cases & Error Handling

### 1. Permissions

- **Test:** Developer tries to access another developer's 1-on-1
  - **Expected:** Redirect to dashboard

- **Test:** Developer tries to submit manager's 1-on-1
  - **Expected:** Error message

### 2. Status Transitions

- **Test:** Manager tries to submit (only developers can)
  - **Expected:** Error message

- **Test:** Try to complete 1-on-1 without answers
  - **Expected:** Completes but metrics may be null

### 3. Action Items

- **Test:** Update action item status to "completed"
  - **Expected:** Completed timestamp set, item grayed out

- **Test:** Delete action item
  - **Expected:** Confirmation dialog, then removed

### 4. Notifications

- **Test:** Click notification for deleted 1-on-1
  - **Expected:** Graceful error or redirect

---

## Quick Test Checklist

Use this for rapid testing:

### ✅ Authentication
- [ ] Google OAuth login works
- [ ] Users created in app_users table
- [ ] Roles assigned correctly

### ✅ Admin Features
- [ ] Create teams
- [ ] Manage users
- [ ] Create questions
- [ ] View all 1-on-1s

### ✅ Manager Features
- [ ] View team dashboard
- [ ] Create 1-on-1s
- [ ] Review submissions
- [ ] Complete 1-on-1s
- [ ] Create action items
- [ ] View team analytics
- [ ] Send reminders

### ✅ Developer Features
- [ ] Complete self-assessment
- [ ] Submit to manager
- [ ] View feedback
- [ ] Track progress
- [ ] Manage action items

### ✅ Notifications
- [ ] Bell icon shows count
- [ ] Click to open dropdown
- [ ] Notifications appear for events
- [ ] Mark as read works
- [ ] Navigation from notifications works

### ✅ Analytics
- [ ] Metrics calculate on completion
- [ ] Progress chart displays
- [ ] Team analytics show
- [ ] Trends visible
- [ ] Alignment scores accurate

### ✅ Action Items
- [ ] Create action items
- [ ] Update status
- [ ] Due date tracking
- [ ] Overdue indicators
- [ ] Delete action items

---

## Sample Test Data

### Company Questions
```sql
INSERT INTO questions (question_text, question_type, scope, is_active, sort_order)
VALUES
  ('How satisfied are you with your current projects?', 'rating_1_5', 'company', true, 1),
  ('What are your top achievements this month?', 'text', 'company', true, 2),
  ('How would you rate your work-life balance?', 'rating_1_5', 'company', true, 3),
  ('What support do you need?', 'text', 'company', true, 4),
  ('Are you on track with your goals?', 'rating_1_5', 'company', true, 5);
```

### Sample Ratings
- **Good performance:** 4-5 on all ratings
- **Needs improvement:** 2-3 on most ratings
- **Mixed:** Varied ratings showing specific areas of strength/weakness

---

## Troubleshooting

### Issue: Notifications not appearing
- **Check:** Database triggers are active
- **Check:** Notifications table in Supabase
- **Fix:** Re-run migration 00007

### Issue: Metrics not calculating
- **Check:** 1-on-1 status is "completed"
- **Check:** Answers exist in database
- **Fix:** Manually trigger: `calculateAndSaveMetrics(oneOnOneId)`

### Issue: Action items not showing
- **Check:** Action items table has data
- **Check:** RLS policies are correct
- **Fix:** Re-run migration 00006

---

## Next Steps After Testing

1. **Performance Test:** Create 50+ 1-on-1s and test load times
2. **Security Test:** Verify RLS prevents unauthorized access
3. **Email Setup:** Configure email service for notifications
4. **Mobile Test:** Test responsive design on mobile devices
5. **Production Deploy:** Deploy to Vercel/production environment

---

## Support

If you encounter issues:
1. Check Supabase logs for errors
2. Verify migrations ran successfully
3. Check browser console for client errors
4. Review RLS policies in Supabase dashboard

Happy Testing! 🚀
