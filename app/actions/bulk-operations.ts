'use server';

import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/auth/user-context';
import { revalidatePath } from 'next/cache';

/**
 * Create 1-on-1s for all team members for a specific month
 */
export async function createBulkOneOnOnesForTeam(monthYear: string) {
  const user = await requireAuth();
  const supabase = await createClient();

  // Only managers and admins can create bulk 1-on-1s
  if (user.role !== 'manager' && user.role !== 'admin') {
    throw new Error('Only managers and admins can create bulk 1-on-1s');
  }

  // Get the manager's team
  const { data: team } = await supabase
    .from('teams')
    .select('id')
    .eq('manager_id', user.id)
    .single();

  if (!team) {
    throw new Error('Team not found');
  }

  // Get all developers in the team
  const { data: developers } = await supabase
    .from('app_users')
    .select('id')
    .eq('team_id', team.id)
    .eq('role', 'developer');

  if (!developers || developers.length === 0) {
    return { created: 0, skipped: 0, message: 'No developers found in team' };
  }

  let created = 0;
  let skipped = 0;

  for (const developer of developers) {
    // Check if 1-on-1 already exists
    const { data: existing } = await supabase
      .from('one_on_ones')
      .select('id')
      .eq('developer_id', developer.id)
      .eq('manager_id', user.id)
      .eq('month_year', monthYear)
      .single();

    if (existing) {
      skipped++;
      continue;
    }

    // Create new 1-on-1
    const { error } = await supabase
      .from('one_on_ones')
      .insert({
        developer_id: developer.id,
        manager_id: user.id,
        team_id: team.id,
        month_year: monthYear,
        status: 'draft',
      });

    if (error) {
      console.error(`Failed to create 1-on-1 for developer ${developer.id}:`, error);
      skipped++;
    } else {
      created++;
    }
  }

  revalidatePath('/dashboard');

  return {
    created,
    skipped,
    message: `Created ${created} 1-on-1(s), ${skipped} already existed or failed`,
  };
}

/**
 * Send reminders to all team members who haven't submitted their 1-on-1s
 */
export async function sendBulkReminders(monthYear: string) {
  const user = await requireAuth();
  const supabase = await createClient();

  if (user.role !== 'manager' && user.role !== 'admin') {
    throw new Error('Only managers and admins can send reminders');
  }

  // Get the manager's team
  const { data: team } = await supabase
    .from('teams')
    .select('id')
    .eq('manager_id', user.id)
    .single();

  if (!team) {
    throw new Error('Team not found');
  }

  // Get all developers in the team
  const { data: developers } = await supabase
    .from('app_users')
    .select('id, email, full_name')
    .eq('team_id', team.id)
    .eq('role', 'developer');

  if (!developers || developers.length === 0) {
    return { remindersSent: 0, message: 'No developers found in team' };
  }

  let remindersSent = 0;

  for (const developer of developers) {
    // Check if they have a draft 1-on-1
    const { data: oneOnOne } = await supabase
      .from('one_on_ones')
      .select('id, status')
      .eq('developer_id', developer.id)
      .eq('manager_id', user.id)
      .eq('month_year', monthYear)
      .single();

    if (oneOnOne && oneOnOne.status === 'draft') {
      // Create reminder notification
      await supabase
        .from('notifications')
        .insert({
          user_id: developer.id,
          notification_type: 'one_on_one_reminder',
          title: '1-on-1 Reminder',
          message: `Don't forget to complete your ${monthYear} 1-on-1!`,
          related_id: oneOnOne.id,
          related_type: 'one_on_one',
        });

      remindersSent++;
    }
  }

  revalidatePath('/dashboard');

  return {
    remindersSent,
    message: `Sent ${remindersSent} reminder(s)`,
  };
}

/**
 * Export 1-on-1 data for a specific period
 */
export async function exportOneOnOneData(
  startMonth: string,
  endMonth: string,
  teamId?: string
) {
  const user = await requireAuth();
  const supabase = await createClient();

  // Only managers and admins can export data
  if (user.role !== 'manager' && user.role !== 'admin') {
    throw new Error('Only managers and admins can export data');
  }

  let query = supabase
    .from('one_on_ones')
    .select(`
      *,
      developer:app_users!developer_id(id, email, full_name),
      manager:app_users!manager_id(id, email, full_name),
      answers(*),
      notes(*),
      action_items(*),
      metrics:metrics_snapshots(*)
    `)
    .gte('month_year', startMonth)
    .lte('month_year', endMonth);

  // If manager, filter to their team
  if (user.role === 'manager') {
    const { data: team } = await supabase
      .from('teams')
      .select('id')
      .eq('manager_id', user.id)
      .single();

    if (team) {
      query = query.eq('team_id', team.id);
    }
  } else if (teamId) {
    // Admins can filter by specific team
    query = query.eq('team_id', teamId);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to export data: ${error.message}`);
  }

  return data || [];
}

/**
 * Get summary statistics for bulk operations dashboard
 */
export async function getBulkOperationsStats(monthYear: string) {
  const user = await requireAuth();
  const supabase = await createClient();

  if (user.role !== 'manager' && user.role !== 'admin') {
    throw new Error('Only managers and admins can view bulk stats');
  }

  // Get the manager's team
  const { data: team } = await supabase
    .from('teams')
    .select('id')
    .eq('manager_id', user.id)
    .single();

  if (!team) {
    return null;
  }

  // Get team members count
  const { count: totalMembers } = await supabase
    .from('app_users')
    .select('*', { count: 'exact', head: true })
    .eq('team_id', team.id)
    .eq('role', 'developer');

  // Get 1-on-1 stats
  const { data: oneOnOnes } = await supabase
    .from('one_on_ones')
    .select('status')
    .eq('manager_id', user.id)
    .eq('month_year', monthYear);

  const stats = {
    totalMembers: totalMembers || 0,
    draft: oneOnOnes?.filter(o => o.status === 'draft').length || 0,
    submitted: oneOnOnes?.filter(o => o.status === 'submitted').length || 0,
    reviewed: oneOnOnes?.filter(o => o.status === 'reviewed').length || 0,
    completed: oneOnOnes?.filter(o => o.status === 'completed').length || 0,
  };

  stats.draft = stats.totalMembers - stats.submitted - stats.reviewed - stats.completed;

  return stats;
}
