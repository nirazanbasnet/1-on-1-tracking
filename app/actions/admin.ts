'use server';

import { createClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/auth/user-context';
import { revalidatePath } from 'next/cache';

/**
 * Update a user's role
 */
export async function updateUserRole(userId: string, newRole: 'admin' | 'manager' | 'developer') {
  await requireAdmin();

  const supabase = await createClient();

  // First, verify the user exists
  const { data: existingUser, error: fetchError } = await supabase
    .from('app_users')
    .select('id, email, role')
    .eq('id', userId)
    .single();

  if (fetchError || !existingUser) {
    console.error('User not found:', fetchError);
    throw new Error('User not found');
  }

  // Perform the update
  const { error: updateError, count } = await supabase
    .from('app_users')
    .update({ role: newRole })
    .eq('id', userId);

  if (updateError) {
    console.error('Failed to update user role:', updateError);
    throw new Error(`Failed to update user role: ${updateError.message}`);
  }

  // Verify the update
  const { data: updatedUser } = await supabase
    .from('app_users')
    .select('id, email, role')
    .eq('id', userId)
    .single();

  revalidatePath('/dashboard');
  return { success: true, data: updatedUser };
}

/**
 * Assign a user to a team
 */
export async function assignUserToTeam(userId: string, teamId: string | null) {
  await requireAdmin();

  const supabase = await createClient();

  const { error } = await supabase
    .from('app_users')
    .update({ team_id: teamId })
    .eq('id', userId);

  if (error) {
    throw new Error(`Failed to assign user to team: ${error.message}`);
  }

  revalidatePath('/dashboard');
  return { success: true };
}

/**
 * Create a new team
 */
export async function createTeam(name: string, managerId?: string) {
  await requireAdmin();

  const supabase = await createClient();

  const teamData: { name: string; manager_id?: string } = { name };
  if (managerId) {
    teamData.manager_id = managerId;
  }

  const { data, error } = await supabase
    .from('teams')
    .insert(teamData)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create team: ${error.message}`);
  }

  revalidatePath('/dashboard');
  return { success: true, team: data };
}

/**
 * Update team details
 */
export async function updateTeam(teamId: string, name: string, managerId?: string | null) {
  await requireAdmin();

  const supabase = await createClient();

  const updateData: { name: string; manager_id?: string | null } = { name };
  if (managerId !== undefined) {
    updateData.manager_id = managerId;
  }

  const { error } = await supabase
    .from('teams')
    .update(updateData)
    .eq('id', teamId);

  if (error) {
    throw new Error(`Failed to update team: ${error.message}`);
  }

  revalidatePath('/dashboard');
  return { success: true };
}

/**
 * Delete a team
 */
export async function deleteTeam(teamId: string) {
  await requireAdmin();

  const supabase = await createClient();

  // First, check if any users are assigned to this team
  const { data: users } = await supabase
    .from('app_users')
    .select('id')
    .eq('team_id', teamId);

  if (users && users.length > 0) {
    throw new Error('Cannot delete team with assigned members. Please reassign them first.');
  }

  const { error } = await supabase
    .from('teams')
    .delete()
    .eq('id', teamId);

  if (error) {
    throw new Error(`Failed to delete team: ${error.message}`);
  }

  revalidatePath('/dashboard');
  return { success: true };
}
