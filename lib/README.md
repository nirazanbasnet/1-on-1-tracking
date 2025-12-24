# Library Utilities Reference

## Authentication & User Context

Import from: `@/lib/auth/user-context`

### Functions:

```typescript
// Get current authenticated user
const authUser = await getCurrentAuthUser();

// Get current user's app profile with team info
const profile = await getCurrentUserProfile();

// Check roles
const adminStatus = await isAdmin();
const managerStatus = await isManager();
const developerStatus = await isDeveloper();

// Get managed team (for managers)
const team = await getManagedTeam();

// Get team members (for managers)
const members = await getTeamMembers();

// Require authentication (throws if not logged in)
const user = await requireAuth();

// Require specific roles (throws if wrong role)
const admin = await requireAdmin();
const manager = await requireManager();
```

---

## 1-on-1 Management

Import from: `@/lib/one-on-ones/management`

### Functions:

```typescript
// Get current month (YYYY-MM format)
const month = getCurrentMonth(); // "2025-01"

// Get or create 1-on-1 for developer
const oneOnOne = await getOrCreateOneOnOne(developerId);
const oneOnOne = await getOrCreateOneOnOne(developerId, '2025-01');

// Create 1-on-1s for entire team
const result = await createTeamOneOnOnes(teamId);
// Returns: { created: 5, existing: 2, errors: 0 }

// Get specific 1-on-1
const oneOnOne = await getOneOnOne(developerId, '2025-01');

// Get all 1-on-1s for a developer
const oneOnOnes = await getDeveloperOneOnOnes(developerId);

// Get all 1-on-1s for a manager
const oneOnOnes = await getManagerOneOnOnes(managerId);
const currentMonth = await getManagerOneOnOnes(managerId, '2025-01');

// Complete a 1-on-1
const completed = await completeOneOnOne(oneOnOneId);

// Reopen a 1-on-1
const reopened = await reopenOneOnOne(oneOnOneId);

// Check if can complete
const check = await canCompleteOneOnOne(oneOnOneId);
// Returns: { canComplete: true } or { canComplete: false, reason: "..." }
```

---

## Database Types

Import from: `@/lib/types/database`

### Available Types:

```typescript
// Enums
UserRole = 'admin' | 'manager' | 'developer'
OneOnOneStatus = 'draft' | 'completed'
QuestionType = 'rating_1_5' | 'rating_1_10' | 'text' | 'yes_no'
QuestionScope = 'company' | 'team'
AnswerSource = 'developer' | 'manager'
NoteType = 'developer_note' | 'manager_feedback'
ActionStatus = 'pending' | 'in_progress' | 'completed'

// Entities
Team
AppUser
OneOnOne
Question
Answer
Note
ActionItem
MetricsSnapshot

// Extended types
AppUserWithTeam
OneOnOneWithDetails
```

---

## Supabase Clients

### Browser Client
```typescript
import { createClient } from '@/lib/supabase/client';

const supabase = createClient();
```

### Server Client
```typescript
import { createClient } from '@/lib/supabase/server';

const supabase = await createClient();
```

---

## Example Usage Patterns

### Server Component:
```typescript
import { getCurrentUserProfile } from '@/lib/auth/user-context';
import { getDeveloperOneOnOnes } from '@/lib/one-on-ones/management';

export default async function MyPage() {
  const user = await getCurrentUserProfile();

  if (!user) {
    redirect('/');
  }

  const oneOnOnes = await getDeveloperOneOnOnes(user.id);

  return <div>...</div>;
}
```

### Server Action:
```typescript
'use server';

import { requireAuth } from '@/lib/auth/user-context';
import { completeOneOnOne } from '@/lib/one-on-ones/management';

export async function handleComplete(oneOnOneId: string) {
  const user = await requireAuth();

  const result = await completeOneOnOne(oneOnOneId);

  if (!result) {
    return { error: 'Failed to complete' };
  }

  return { success: true };
}
```

### Direct Supabase Query:
```typescript
import { createClient } from '@/lib/supabase/server';

const supabase = await createClient();

const { data, error } = await supabase
  .from('questions')
  .select('*')
  .eq('is_active', true)
  .order('sort_order');
```

---

## Security Notes

1. **Always use server-side functions** for sensitive operations
2. **RLS policies** are enabled on all tables - they enforce access control
3. **Never bypass RLS** unless you're using the service role key (which you shouldn't in app code)
4. **User context helpers** respect RLS automatically
5. **Direct Supabase queries** also respect RLS when using the anon key

---

## Common Patterns

### Get current user's 1-on-1 for this month:
```typescript
const user = await getCurrentUserProfile();
const oneOnOne = await getOrCreateOneOnOne(user!.id);
```

### Manager creating 1-on-1s for their team:
```typescript
const user = await requireManager();
const team = await getManagedTeam();
const result = await createTeamOneOnOnes(team!.id);
```

### Check if user can complete their 1-on-1:
```typescript
const user = await getCurrentUserProfile();
const oneOnOne = await getOneOnOne(user!.id, getCurrentMonth());
const check = await canCompleteOneOnOne(oneOnOne!.id);

if (check.canComplete) {
  await completeOneOnOne(oneOnOne!.id);
} else {
  console.log('Cannot complete:', check.reason);
}
```
