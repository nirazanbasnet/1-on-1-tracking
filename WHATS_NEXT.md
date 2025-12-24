# What's Next - Feature Roadmap

After completing the multi-team support deployment, here are the recommended next steps.

## Immediate Tasks (This Week)

### 1. Deploy Multi-Team Support ⏳
**Priority**: CRITICAL
**Files**: See `DEPLOYMENT_CHECKLIST.md`

- [ ] Apply RLS policy fix
- [ ] Calculate December metrics
- [ ] Test all user roles
- [ ] Verify multi-team assignments work

**Time**: 30-60 minutes
**Blockers**: None - all code is ready

---

### 2. Fix Manager Dashboard "No Team Assigned"
**Priority**: HIGH
**Current Issue**: Manager role exists but team doesn't reference them

**Fix**:
```sql
-- Assign manager to their team
UPDATE teams
SET manager_id = (SELECT id FROM app_users WHERE role = 'manager' LIMIT 1)
WHERE manager_id IS NULL;
```

**Verify**:
- Manager dashboard shows team members
- Manager can create 1-on-1s for their team

---

### 3. Test Multi-Team Edge Cases
**Priority**: MEDIUM

Test these scenarios:
- User belongs to 2+ teams
- User removed from all teams
- Manager manages multiple teams
- Developer switches teams mid-month
- 1-on-1 when user has multiple teams (which team_id is used?)

**Document findings** and create fixes if needed.

---

## Short Term (Next 2 Weeks)

### 4. Implement Analytics Page 📊
**Priority**: HIGH
**Status**: Plan exists at `~/.claude/plans/inherited-riding-wall.md`

**What it includes**:
- Spiral charts showing monthly progress
- Developer performance trends
- Manager team analytics
- Comparative analytics across developers
- Action items tracking

**Benefits**:
- Better visibility into team performance
- Data-driven insights for managers
- Motivation for developers
- Historical trend analysis

**Start with**: Install Recharts and create server actions
```bash
npm install recharts @types/recharts
```

---

### 5. Add Metrics Auto-Calculation
**Priority**: MEDIUM
**Current Issue**: Metrics only calculate when 1-on-1 completed, but sometimes fails

**Implementation**:
1. Add database trigger or cron job
2. Automatically calculate metrics when status = 'completed'
3. Retry failed calculations
4. Log errors for debugging

**Files to modify**:
- `app/actions/metrics.ts` - Add retry logic
- Create Supabase Edge Function or cron job

---

### 6. Improve Error Handling
**Priority**: MEDIUM

**Current gaps**:
- Silent failures in metrics calculation
- No user-facing error messages
- RLS errors not caught properly

**Implementation**:
1. Add try-catch blocks in server actions
2. Return user-friendly error messages
3. Log errors to monitoring service
4. Show toast notifications on errors

---

## Medium Term (Next Month)

### 7. Add Bulk Operations
**Priority**: LOW

**Features**:
- Bulk create 1-on-1s for entire team
- Bulk assign users to teams
- Export/import team data
- Bulk notifications

---

### 8. Improve Notifications System
**Priority**: MEDIUM

**Current state**: Table exists but not fully implemented

**Features to add**:
- Email notifications for pending 1-on-1s
- Reminders for incomplete answers
- Manager notifications when developer submits
- In-app notification badge

**Files**:
- `supabase/migrations/00007_notifications_safe.sql` - Table exists
- Need to implement notification triggers and UI

---

### 9. Add Team Transfer Feature
**Priority**: LOW

**Use case**: Developer moves to different team mid-month

**Implementation**:
1. UI to move user between teams
2. Preserve historical 1-on-1s with old team
3. Create new 1-on-1s with new team
4. Update metrics snapshots team_id

---

### 10. Performance Optimization
**Priority**: MEDIUM

**Areas to optimize**:
- Dashboard query performance
- Reduce number of database calls
- Implement caching for metrics
- Lazy load large datasets
- Add database indexes

---

## Long Term (Next Quarter)

### 11. Advanced Reporting
**Priority**: MEDIUM

**Features**:
- PDF export of 1-on-1 summaries
- Manager performance reports
- Quarterly team reviews
- Custom report builder

---

### 12. Integration Features
**Priority**: LOW

**Potential integrations**:
- Slack notifications
- Google Calendar for 1-on-1 scheduling
- Jira for action items
- Export to HR systems

---

### 13. AI-Powered Insights
**Priority**: LOW

**Features**:
- Sentiment analysis on text answers
- Identify common themes across team
- Suggest questions based on trends
- Predictive analytics for team health

---

## Technical Debt

### Code Quality
- [ ] Add comprehensive TypeScript types
- [ ] Write unit tests for server actions
- [ ] Add E2E tests for critical flows
- [ ] Document all functions with JSDoc
- [ ] Set up code linting/formatting

### Database
- [ ] Review and optimize all RLS policies
- [ ] Add proper indexes for common queries
- [ ] Set up database monitoring
- [ ] Create backup/restore procedures

### DevOps
- [ ] Set up CI/CD pipeline
- [ ] Add staging environment
- [ ] Implement feature flags
- [ ] Set up error monitoring (Sentry)

---

## Recommended Priority Order

**Week 1-2**:
1. ✅ Deploy multi-team support
2. ✅ Fix manager dashboard
3. ✅ Test edge cases
4. 🎯 Start analytics page implementation

**Week 3-4**:
5. Analytics page (Phase 1: Developer view)
6. Analytics page (Phase 2: Manager view)
7. Auto-calculate metrics
8. Improve error handling

**Month 2**:
9. Analytics page (Phase 3: Admin view)
10. Notifications system
11. Performance optimization
12. Testing and bug fixes

**Month 3+**:
13. Advanced reporting
14. Bulk operations
15. Integrations
16. AI features

---

## Success Metrics

Track these to measure progress:

**User Engagement**:
- % of developers completing monthly 1-on-1s
- Average time to complete
- Manager review turnaround time

**System Health**:
- Error rate
- Page load times
- Database query performance

**Feature Adoption**:
- Multi-team usage
- Analytics page views
- Report generation frequency

---

## Need Help?

**Documentation**:
- `DEPLOYMENT_CHECKLIST.md` - Deploy current changes
- `COMPLETE_FIX_SUMMARY.md` - Code changes made
- `SQL_ORGANIZATION.md` - SQL file organization
- Plan file - Analytics page implementation

**Next Action**: Follow `DEPLOYMENT_CHECKLIST.md` to deploy multi-team support!
