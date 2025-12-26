'use server';

import { createClient } from '@/lib/supabase/server';
import { getCurrentUserProfile, requireAuth } from '@/lib/auth/user-context';
import { revalidatePath } from 'next/cache';
import type { OneOnOne } from '@/lib/types/database';
import { calculateAndSaveMetrics } from './metrics';

/**
 * Get all 1-on-1s where the current user is the developer
 */
export async function getMyOneOnOnes() {
  const user = await requireAuth();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('one_on_ones')
    .select(`
      *,
      manager:app_users!manager_id(id, email, full_name),
      developer:app_users!developer_id(id, email, full_name)
    `)
    .eq('developer_id', user.id)
    .order('month_year', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch your 1-on-1s: ${error.message}`);
  }

  return data || [];
}

/**
 * Get all 1-on-1s where the current user is the manager
 */
export async function getTeamOneOnOnes() {
  const user = await requireAuth();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('one_on_ones')
    .select(`
      *,
      manager:app_users!manager_id(id, email, full_name),
      developer:app_users!developer_id(id, email, full_name)
    `)
    .eq('manager_id', user.id)
    .order('month_year', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch team 1-on-1s: ${error.message}`);
  }

  return data || [];
}

/**
 * Get or create a 1-on-1 for the current month
 */
export async function getOrCreateCurrentMonthOneOnOne(developerId: string) {
  const user = await requireAuth();
  const supabase = await createClient();

  // Verify the user is the developer
  const { data: developer } = await supabase
    .from('app_users')
    .select('id, email, full_name, role')
    .eq('id', developerId)
    .single();

  if (!developer) {
    throw new Error('Developer not found');
  }

  // Get developer's team and manager through user_teams junction table
  const { data: userTeam } = await supabase
    .from('user_teams')
    .select(`
      team_id,
      teams!inner(id, name, manager_id)
    `)
    .eq('user_id', developerId)
    .limit(1)
    .maybeSingle();

  // Transform team from array to object
  const team = userTeam && Array.isArray(userTeam.teams) && userTeam.teams.length > 0
    ? userTeam.teams[0]
    : userTeam?.teams as any;

  const isOwnProfile = user.id === developerId;
  const isTheirManager = team?.manager_id === user.id;
  const isAdmin = user.role === 'admin';

  if (!isOwnProfile && !isTheirManager && !isAdmin) {
    throw new Error('You do not have permission to access this 1-on-1');
  }

  // Get current month in YYYY-MM format
  const now = new Date();
  const monthYear = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  // Get the manager ID from the team
  const managerId = team?.manager_id;
  if (!managerId) {
    throw new Error('Developer does not have a manager assigned');
  }

  // Try to find the most recent 1-on-1 for this month
  const { data: existing } = await supabase
    .from('one_on_ones')
    .select('*')
    .eq('developer_id', developerId)
    .eq('manager_id', managerId)
    .eq('month_year', monthYear)
    .order('session_number', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing) {
    return existing;
  }

  // Create new 1-on-1 using admin client to bypass RLS (permissions already checked above)
  const { createAdminClient } = await import('@/lib/supabase/server');
  const adminSupabase = createAdminClient();

  const { data: newOneOnOne, error } = await adminSupabase
    .from('one_on_ones')
    .insert({
      developer_id: developerId,
      manager_id: managerId,
      team_id: userTeam?.team_id,
      month_year: monthYear,
      session_number: 1,
      title: 'Session 1',
      status: 'draft',
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create 1-on-1: ${error.message}`);
  }

  revalidatePath('/dashboard');
  return newOneOnOne;
}

/**
 * Update the status of a 1-on-1
 */
export async function updateOneOnOneStatus(
  oneOnOneId: string,
  newStatus: 'draft' | 'submitted' | 'reviewed' | 'completed'
) {
  const user = await requireAuth();
  const supabase = await createClient();

  // Get the 1-on-1 to verify permissions
  const { data: oneOnOne } = await supabase
    .from('one_on_ones')
    .select('*')
    .eq('id', oneOnOneId)
    .single();

  if (!oneOnOne) {
    throw new Error('1-on-1 not found');
  }

  const isDeveloper = user.id === oneOnOne.developer_id;
  const isManager = user.id === oneOnOne.manager_id;
  const isAdmin = user.role === 'admin';

  if (!isDeveloper && !isManager && !isAdmin) {
    throw new Error('You do not have permission to update this 1-on-1');
  }

  // Validate status transitions
  if (newStatus === 'submitted' && !isDeveloper) {
    throw new Error('Only the developer can submit a 1-on-1');
  }

  if ((newStatus === 'reviewed' || newStatus === 'completed') && !isManager && !isAdmin) {
    throw new Error('Only the manager can mark a 1-on-1 as reviewed or completed');
  }

  const updateData: Partial<OneOnOne> = { status: newStatus };

  // Set timestamps based on status
  if (newStatus === 'submitted') {
    updateData.developer_submitted_at = new Date().toISOString();
  } else if (newStatus === 'reviewed') {
    updateData.manager_reviewed_at = new Date().toISOString();
  } else if (newStatus === 'completed') {
    updateData.completed_at = new Date().toISOString();
  }

  const { error } = await supabase
    .from('one_on_ones')
    .update(updateData)
    .eq('id', oneOnOneId);

  if (error) {
    throw new Error(`Failed to update status: ${error.message}`);
  }

  // Calculate and save metrics when 1-on-1 is completed
  if (newStatus === 'completed') {
    try {
      await calculateAndSaveMetrics(oneOnOneId);
    } catch (metricsError) {
      // Log the error but don't fail the status update
      console.error('Failed to calculate metrics:', metricsError);
    }
  }

  revalidatePath('/dashboard');
  revalidatePath(`/one-on-one/${oneOnOneId}`);
  return { success: true };
}

/**
 * Get a specific 1-on-1 by ID
 */
export async function getOneOnOneById(oneOnOneId: string) {
  const user = await requireAuth();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('one_on_ones')
    .select(`
      *,
      manager:app_users!manager_id(id, email, full_name),
      developer:app_users!developer_id(id, email, full_name)
    `)
    .eq('id', oneOnOneId)
    .single();

  if (error) {
    throw new Error(`Failed to fetch 1-on-1: ${error.message}`);
  }

  // Verify permissions
  const isDeveloper = user.id === data.developer_id;
  const isManager = user.id === data.manager_id;
  const isAdmin = user.role === 'admin';

  if (!isDeveloper && !isManager && !isAdmin) {
    throw new Error('You do not have permission to view this 1-on-1');
  }

  return data;
}

/**
 * Create a 1-on-1 for a specific developer and month (manager action)
 */
export async function createOneOnOne(developerId: string, monthYear: string) {
  const user = await requireAuth();
  const supabase = await createClient();

  // Verify the current user is a manager or admin
  if (user.role !== 'manager' && user.role !== 'admin') {
    throw new Error('Only managers can create 1-on-1s');
  }

  // Get the developer
  const { data: developer } = await supabase
    .from('app_users')
    .select('id, email, full_name, role')
    .eq('id', developerId)
    .single();

  if (!developer) {
    throw new Error('Developer not found');
  }

  // Get developer's team and manager through user_teams junction table
  const { data: userTeam } = await supabase
    .from('user_teams')
    .select(`
      team_id,
      teams!inner(id, name, manager_id)
    `)
    .eq('user_id', developerId)
    .limit(1)
    .maybeSingle();

  // Transform team from array to object
  const team = userTeam && Array.isArray(userTeam.teams) && userTeam.teams.length > 0
    ? userTeam.teams[0]
    : userTeam?.teams as any;

  // Verify the current user is the developer's manager
  const isTheirManager = team?.manager_id === user.id;
  const isAdmin = user.role === 'admin';

  if (!isTheirManager && !isAdmin) {
    throw new Error('You can only create 1-on-1s for your team members');
  }

  const managerId = team?.manager_id;
  if (!managerId) {
    throw new Error('Developer does not have a manager assigned');
  }

  // Find the highest session number for this month to create next session
  const { data: existingSessions } = await supabase
    .from('one_on_ones')
    .select('session_number')
    .eq('developer_id', developerId)
    .eq('manager_id', managerId)
    .eq('month_year', monthYear)
    .order('session_number', { ascending: false })
    .limit(1);

  // Calculate next session number
  const nextSessionNumber = existingSessions && existingSessions.length > 0
    ? (existingSessions[0].session_number || 0) + 1
    : 1;

  // Create new 1-on-1 using admin client to bypass RLS (permissions already checked above)
  const { createAdminClient } = await import('@/lib/supabase/server');
  const adminSupabase = createAdminClient();

  const { data: newOneOnOne, error } = await adminSupabase
    .from('one_on_ones')
    .insert({
      developer_id: developerId,
      manager_id: managerId,
      team_id: userTeam?.team_id,
      month_year: monthYear,
      session_number: nextSessionNumber,
      title: `Session ${nextSessionNumber}`,
      status: 'draft',
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create 1-on-1: ${error.message}`);
  }

  revalidatePath('/dashboard');
  return newOneOnOne;
}
