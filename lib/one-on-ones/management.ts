import { createClient } from '@/lib/supabase/server';
import type { OneOnOne } from '@/lib/types/database';

/**
 * Get current month in YYYY-MM format
 */
export function getCurrentMonth(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/**
 * Get or create a 1-on-1 for the current month
 * This ensures there's always a 1-on-1 record for the developer
 */
export async function getOrCreateOneOnOne(
  developerId: string,
  month?: string
): Promise<OneOnOne | null> {
  const supabase = await createClient();
  const targetMonth = month || getCurrentMonth();

  // First, try to find existing 1-on-1
  const { data: existing } = await supabase
    .from('one_on_ones')
    .select('*')
    .eq('developer_id', developerId)
    .eq('month', targetMonth)
    .single();

  if (existing) {
    return existing;
  }

  // Get the developer's first team assignment and manager
  const { data: userTeam } = await supabase
    .from('user_teams')
    .select(`
      team_id,
      team:teams(id, manager_id)
    `)
    .eq('user_id', developerId)
    .limit(1)
    .single();

  if (!userTeam || !userTeam.team?.manager_id) {
    // Developer doesn't have a team or manager assigned yet
    return null;
  }

  // Create new 1-on-1
  const { data: newOneOnOne, error } = await supabase
    .from('one_on_ones')
    .insert({
      developer_id: developerId,
      manager_id: userTeam.team.manager_id,
      team_id: userTeam.team_id,
      month: targetMonth,
      status: 'draft',
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating 1-on-1:', error);
    return null;
  }

  return newOneOnOne;
}

/**
 * Create 1-on-1s for all developers in a team for the current month
 * Typically called by managers or via cron job
 */
export async function createTeamOneOnOnes(
  teamId: string,
  month?: string
): Promise<{ created: number; existing: number; errors: number }> {
  const supabase = await createClient();
  const targetMonth = month || getCurrentMonth();

  // Get all developers in the team using user_teams junction table
  const { data: userTeams } = await supabase
    .from('user_teams')
    .select(`
      user_id,
      app_users!inner(id, role)
    `)
    .eq('team_id', teamId);

  const developers = userTeams
    ?.map(ut => ut.app_users)
    .filter((user: any) => user && user.role === 'developer')
    .map((user: any) => ({ id: user.id }));

  if (!developers || developers.length === 0) {
    return { created: 0, existing: 0, errors: 0 };
  }

  let created = 0;
  let existing = 0;
  let errors = 0;

  for (const developer of developers) {
    const result = await getOrCreateOneOnOne(developer.id, targetMonth);
    if (result) {
      // Check if it was just created
      const justCreated = new Date(result.created_at).getTime() > Date.now() - 1000;
      if (justCreated) {
        created++;
      } else {
        existing++;
      }
    } else {
      errors++;
    }
  }

  return { created, existing, errors };
}

/**
 * Get a developer's 1-on-1 for a specific month
 */
export async function getOneOnOne(
  developerId: string,
  month: string
): Promise<OneOnOne | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('one_on_ones')
    .select('*')
    .eq('developer_id', developerId)
    .eq('month', month)
    .single();

  if (error) {
    return null;
  }

  return data;
}

/**
 * Get all 1-on-1s for a developer
 */
export async function getDeveloperOneOnOnes(
  developerId: string
): Promise<OneOnOne[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from('one_on_ones')
    .select('*')
    .eq('developer_id', developerId)
    .order('month', { ascending: false });

  return data || [];
}

/**
 * Get all 1-on-1s for a manager's team
 */
export async function getManagerOneOnOnes(
  managerId: string,
  month?: string
): Promise<OneOnOne[]> {
  const supabase = await createClient();

  let query = supabase
    .from('one_on_ones')
    .select(`
      *,
      developer:app_users!developer_id(id, email, full_name)
    `)
    .eq('manager_id', managerId);

  if (month) {
    query = query.eq('month', month);
  }

  const { data } = await query.order('month', { ascending: false });

  return data || [];
}

/**
 * Complete a 1-on-1 (change status from draft to completed)
 */
export async function completeOneOnOne(
  oneOnOneId: string
): Promise<OneOnOne | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('one_on_ones')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
    })
    .eq('id', oneOnOneId)
    .select()
    .single();

  if (error) {
    console.error('Error completing 1-on-1:', error);
    return null;
  }

  return data;
}

/**
 * Reopen a completed 1-on-1 (change status back to draft)
 */
export async function reopenOneOnOne(
  oneOnOneId: string
): Promise<OneOnOne | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('one_on_ones')
    .update({
      status: 'draft',
      completed_at: null,
    })
    .eq('id', oneOnOneId)
    .select()
    .single();

  if (error) {
    console.error('Error reopening 1-on-1:', error);
    return null;
  }

  return data;
}

/**
 * Check if a 1-on-1 can be completed
 * (e.g., has all required answers)
 */
export async function canCompleteOneOnOne(
  oneOnOneId: string
): Promise<{ canComplete: boolean; reason?: string }> {
  const supabase = await createClient();

  // Get the 1-on-1
  const { data: oneOnOne } = await supabase
    .from('one_on_ones')
    .select('*')
    .eq('id', oneOnOneId)
    .single();

  if (!oneOnOne) {
    return { canComplete: false, reason: '1-on-1 not found' };
  }

  if (oneOnOne.status === 'completed') {
    return { canComplete: false, reason: 'Already completed' };
  }

  // Get active questions for this 1-on-1 using the team_id from one_on_ones table
  const { data: questions } = await supabase
    .from('questions')
    .select('id')
    .eq('is_active', true)
    .or(`scope.eq.company,and(scope.eq.team,team_id.eq.${oneOnOne.team_id})`);

  // Get developer answers
  const { data: answers } = await supabase
    .from('answers')
    .select('question_id')
    .eq('one_on_one_id', oneOnOneId)
    .eq('answered_by', 'developer');

  const answeredQuestionIds = new Set(answers?.map(a => a.question_id) || []);
  const unansweredCount = (questions?.length || 0) - answeredQuestionIds.size;

  if (unansweredCount > 0) {
    return {
      canComplete: false,
      reason: `${unansweredCount} unanswered question(s)`,
    };
  }

  return { canComplete: true };
}
