# Implementation Guide: Analytics & Multi-Session Updates

## 🎯 Overview
This guide covers implementing:
1. Categorized questions with radar chart analytics
2. Manager member detail pages with history
3. Multiple 1-on-1 sessions per month

## 📝 Step 1: Apply Database Migration

**Go to Supabase Dashboard → SQL Editor and run:**

```sql
-- The migration file is at: supabase/migrations/00011_add_question_categories.sql
-- Copy and paste the entire contents into Supabase SQL Editor and execute
```

This will:
- Add `category` column to questions table
- Create 48 categorized questions (Research, Strategy, Core Qualities, Leadership, Technical)
- Each category has 5-10 questions

## 📝 Step 2: Update Database for Multiple Sessions

Run this in Supabase SQL Editor:

```sql
-- Remove unique constraint on one_on_ones to allow multiple sessions per month
ALTER TABLE one_on_ones DROP CONSTRAINT IF EXISTS one_on_ones_developer_id_manager_id_month_year_key;

-- Add a session_number field
ALTER TABLE one_on_ones ADD COLUMN IF NOT EXISTS session_number INTEGER DEFAULT 1;

-- Add title field for session identification
ALTER TABLE one_on_ones ADD COLUMN IF NOT EXISTS title TEXT;

-- Create index for better querying
CREATE INDEX IF NOT EXISTS idx_one_on_ones_developer_month
ON one_on_ones(developer_id, month_year, session_number);

-- Update existing records to have session_number = 1
UPDATE one_on_ones SET session_number = 1 WHERE session_number IS NULL;
```

## 📝 Step 3: Key Files to Review

### Analytics Components:
- ✅ `/components/analytics/skill-radar-chart.tsx` - Created
- ⏳ Update `/components/analytics/developer-deep-dive.tsx` - Need to integrate radar chart
- ⏳ Create `/app/manager/members/[memberId]/page.tsx` - Manager member detail

### Actions to Update:
- ⏳ `/app/actions/analytics.ts` - Add category grouping logic
- ⏳ `/app/actions/one-on-ones.ts` - Allow multiple sessions

## 📊 Analytics Data Structure

The radar chart expects data in this format:

```typescript
const radarData = [
  { category: 'Research', you: 4.2, team: 3.8, fullMark: 5 },
  { category: 'Strategy', you: 3.9, team: 4.1, fullMark: 5 },
  { category: 'Core Qualities', you: 4.5, team: 4.0, fullMark: 5 },
  { category: 'Leadership', you: 3.7, team: 3.9, fullMark: 5 },
  { category: 'Technical', you: 4.3, team: 4.2, fullMark: 5 },
];
```

## 🔄 Multiple Sessions Workflow

**Current:** One 1-on-1 per developer per month
**New:** Multiple 1-on-1s per developer per month

**Manager UI Changes:**
- "Create 1-on-1" button → Shows even if session exists
- Add "Session #" indicator
- Show list of all sessions for the month

## 📈 Categories Mapping

| Category | Questions | Focus Area |
|----------|-----------|------------|
| Research | 10 | User research, usability testing, insights |
| Strategy | 10 | Business alignment, roadmap, design systems |
| Core Qualities | 10 | Problem-solving, communication, empathy |
| Leadership | 8 | Mentoring, influence, team growth |
| Technical | 10 | Tools, prototyping, development collaboration |

## ✅ Testing Checklist

- [ ] Apply both SQL migrations
- [ ] Create a 1-on-1 and answer questions
- [ ] View developer analytics - see radar chart
- [ ] Create multiple sessions for same month
- [ ] View manager member detail page
- [ ] Check category-based scoring

## 🚀 Quick Start Commands

```bash
# Already installed
npm install recharts

# Build and test
npm run build
npm run dev
```

## 📱 Expected UI Changes

### Developer Analytics:
- Radar chart showing 5 categories
- No individual rating values displayed (just visual)
- Compare "You" vs "Team Average"

### Manager Member Detail:
- Navigate to individual developer
- See all months history
- Radar chart for each month
- Trend over time

### Multiple Sessions:
- Manager can create "Session 2", "Session 3" etc.
- Each session has its own questions/answers
- Sessions are numbered and titled
