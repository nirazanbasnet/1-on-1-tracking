'use server';

import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/auth/user-context';
import { revalidatePath } from 'next/cache';

/**
 * Create a new action item
 */
export async function createActionItem(
  oneOnOneId: string,
  description: string,
  assignedTo: 'developer' | 'manager',
  dueDate?: string
) {
  const user = await requireAuth();
  const supabase = await createClient();

  // Verify user has access to this 1-on-1
  const { data: oneOnOne } = await supabase
    .from('one_on_ones')
    .select('developer_id, manager_id')
    .eq('id', oneOnOneId)
    .single();

  if (!oneOnOne) {
    throw new Error('1-on-1 not found');
  }

  const isDeveloper = user.id === oneOnOne.developer_id;
  const isManager = user.id === oneOnOne.manager_id;

  if (!isDeveloper && !isManager) {
    throw new Error('You do not have permission to create action items for this 1-on-1');
  }

  const { data, error } = await supabase
    .from('action_items')
    .insert({
      one_on_one_id: oneOnOneId,
      description,
      assigned_to: assignedTo,
      due_date: dueDate || null,
      status: 'pending',
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create action item: ${error.message}`);
  }

  revalidatePath(`/one-on-one/${oneOnOneId}`);
  revalidatePath('/dashboard');
  return data;
}

/**
 * Update an action item
 */
export async function updateActionItem(
  actionItemId: string,
  updates: {
    description?: string;
    status?: 'pending' | 'in_progress' | 'completed';
    due_date?: string | null;
  }
) {
  const user = await requireAuth();
  const supabase = await createClient();

  // Get the action item to verify permissions
  const { data: actionItem } = await supabase
    .from('action_items')
    .select('*, one_on_one:one_on_ones(developer_id, manager_id)')
    .eq('id', actionItemId)
    .single();

  if (!actionItem) {
    throw new Error('Action item not found');
  }

  const oneOnOne = actionItem.one_on_one as any;
  const isDeveloper = user.id === oneOnOne.developer_id;
  const isManager = user.id === oneOnOne.manager_id;

  if (!isDeveloper && !isManager) {
    throw new Error('You do not have permission to update this action item');
  }

  const updateData: any = { ...updates };

  // Set completed_at when status changes to completed
  if (updates.status === 'completed' && actionItem.status !== 'completed') {
    updateData.completed_at = new Date().toISOString();
  }

  const { error } = await supabase
    .from('action_items')
    .update(updateData)
    .eq('id', actionItemId);

  if (error) {
    throw new Error(`Failed to update action item: ${error.message}`);
  }

  revalidatePath(`/one-on-one/${actionItem.one_on_one_id}`);
  revalidatePath('/dashboard');
  return { success: true };
}

/**
 * Delete an action item
 */
export async function deleteActionItem(actionItemId: string) {
  const user = await requireAuth();
  const supabase = await createClient();

  // Get the action item to verify permissions
  const { data: actionItem } = await supabase
    .from('action_items')
    .select('*, one_on_one:one_on_ones(developer_id, manager_id)')
    .eq('id', actionItemId)
    .single();

  if (!actionItem) {
    throw new Error('Action item not found');
  }

  const oneOnOne = actionItem.one_on_one as any;
  const isDeveloper = user.id === oneOnOne.developer_id;
  const isManager = user.id === oneOnOne.manager_id;

  if (!isDeveloper && !isManager) {
    throw new Error('You do not have permission to delete this action item');
  }

  const { error } = await supabase
    .from('action_items')
    .delete()
    .eq('id', actionItemId);

  if (error) {
    throw new Error(`Failed to delete action item: ${error.message}`);
  }

  revalidatePath(`/one-on-one/${actionItem.one_on_one_id}`);
  revalidatePath('/dashboard');
  return { success: true };
}

/**
 * Get all action items for a 1-on-1
 */
export async function getActionItems(oneOnOneId: string) {
  const user = await requireAuth();
  const supabase = await createClient();

  // Verify user has access to this 1-on-1
  const { data: oneOnOne } = await supabase
    .from('one_on_ones')
    .select('developer_id, manager_id')
    .eq('id', oneOnOneId)
    .single();

  if (!oneOnOne) {
    throw new Error('1-on-1 not found');
  }

  const isDeveloper = user.id === oneOnOne.developer_id;
  const isManager = user.id === oneOnOne.manager_id;
  const isAdmin = user.role === 'admin';

  if (!isDeveloper && !isManager && !isAdmin) {
    throw new Error('You do not have permission to view these action items');
  }

  const { data, error } = await supabase
    .from('action_items')
    .select('*')
    .eq('one_on_one_id', oneOnOneId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch action items: ${error.message}`);
  }

  return data || [];
}

/**
 * Get all pending action items for a user
 */
export async function getMyPendingActionItems() {
  const user = await requireAuth();
  const supabase = await createClient();

  // Get all 1-on-1s where user is developer or manager
  const { data: oneOnOnes } = await supabase
    .from('one_on_ones')
    .select('id, developer_id, manager_id')
    .or(`developer_id.eq.${user.id},manager_id.eq.${user.id}`);

  if (!oneOnOnes || oneOnOnes.length === 0) {
    return [];
  }

  const oneOnOneIds = oneOnOnes.map((o) => o.id);

  // Get action items assigned to this user
  const { data: actionItems, error } = await supabase
    .from('action_items')
    .select(`
      *,
      one_on_one:one_on_ones(
        id,
        month_year,
        developer:app_users!developer_id(full_name, email),
        manager:app_users!manager_id(full_name, email)
      )
    `)
    .in('one_on_one_id', oneOnOneIds)
    .in('status', ['pending', 'in_progress'])
    .order('due_date', { ascending: true, nullsFirst: false });

  if (error) {
    throw new Error(`Failed to fetch action items: ${error.message}`);
  }

  // Filter to only items assigned to the current user
  const filtered = (actionItems || []).filter((item) => {
    const oneOnOne = oneOnOnes.find((o) => o.id === item.one_on_one_id);
    if (!oneOnOne) return false;

    if (item.assigned_to === 'developer') {
      return oneOnOne.developer_id === user.id;
    } else {
      return oneOnOne.manager_id === user.id;
    }
  });

  return filtered;
}
