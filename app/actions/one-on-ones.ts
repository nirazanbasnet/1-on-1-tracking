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

  // Verify the user is the developer or their manager
  const { data: developer } = await supabase
    .from('app_users')
    .select('*, team:teams!team_id(manager_id)')
    .eq('id', developerId)
    .single();

  if (!developer) {
    throw new Error('Developer not found');
  }

  const isOwnProfile = user.id === developerId;
  const isTheirManager = developer.team?.manager_id === user.id;
  const isAdmin = user.role === 'admin';

  if (!isOwnProfile && !isTheirManager && !isAdmin) {
    throw new Error('You do not have permission to access this 1-on-1');
  }

  // Get current month in YYYY-MM format
  const now = new Date();
  const monthYear = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  // Get the manager ID (either from team or current user if they're the manager)
  const managerId = developer.team?.manager_id;
  if (!managerId) {
    throw new Error('Developer does not have a manager assigned');
  }

  // Try to find existing 1-on-1
  const { data: existing } = await supabase
    .from('one_on_ones')
    .select('*')
    .eq('developer_id', developerId)
    .eq('manager_id', managerId)
    .eq('month_year', monthYear)
    .single();

  if (existing) {
    return existing;
  }

  // Create new 1-on-1
  const { data: newOneOnOne, error } = await supabase
    .from('one_on_ones')
    .insert({
      developer_id: developerId,
      manager_id: managerId,
      month_year: monthYear,
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

  // Get the developer's team
  const { data: developer } = await supabase
    .from('app_users')
    .select('*, team:teams!team_id(manager_id)')
    .eq('id', developerId)
    .single();

  if (!developer) {
    throw new Error('Developer not found');
  }

  // Verify the current user is the developer's manager
  const isTheirManager = developer.team?.manager_id === user.id;
  const isAdmin = user.role === 'admin';

  if (!isTheirManager && !isAdmin) {
    throw new Error('You can only create 1-on-1s for your team members');
  }

  const managerId = developer.team?.manager_id;
  if (!managerId) {
    throw new Error('Developer does not have a manager assigned');
  }

  // Check if 1-on-1 already exists
  const { data: existing } = await supabase
    .from('one_on_ones')
    .select('id')
    .eq('developer_id', developerId)
    .eq('manager_id', managerId)
    .eq('month_year', monthYear)
    .single();

  if (existing) {
    throw new Error('A 1-on-1 already exists for this developer and month');
  }

  // Create new 1-on-1
  const { data: newOneOnOne, error } = await supabase
    .from('one_on_ones')
    .insert({
      developer_id: developerId,
      manager_id: managerId,
      month_year: monthYear,
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
