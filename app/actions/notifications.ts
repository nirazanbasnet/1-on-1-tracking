'use server';

import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/auth/user-context';
import { revalidatePath } from 'next/cache';
import type { NotificationType } from '@/lib/types/database';

/**
 * Get notifications for the current user
 */
export async function getMyNotifications(limit: number = 50, unreadOnly: boolean = false) {
  const user = await requireAuth();
  const supabase = await createClient();

  let query = supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (unreadOnly) {
    query = query.eq('is_read', false);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch notifications: ${error.message}`);
  }

  return data || [];
}

/**
 * Get unread notification count
 */
export async function getUnreadNotificationCount() {
  const user = await requireAuth();
  const supabase = await createClient();

  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('is_read', false);

  if (error) {
    throw new Error(`Failed to fetch notification count: ${error.message}`);
  }

  return count || 0;
}

/**
 * Mark notifications as read
 */
export async function markNotificationsAsRead(notificationIds: string[]) {
  const user = await requireAuth();
  const supabase = await createClient();

  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq('user_id', user.id)
    .in('id', notificationIds);

  if (error) {
    throw new Error(`Failed to mark notifications as read: ${error.message}`);
  }

  revalidatePath('/dashboard');
  return { success: true };
}

/**
 * Mark all notifications as read
 */
export async function markAllNotificationsAsRead() {
  const user = await requireAuth();
  const supabase = await createClient();

  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq('user_id', user.id)
    .eq('is_read', false);

  if (error) {
    throw new Error(`Failed to mark all notifications as read: ${error.message}`);
  }

  revalidatePath('/dashboard');
  return { success: true };
}

/**
 * Delete a notification
 */
export async function deleteNotification(notificationId: string) {
  const user = await requireAuth();
  const supabase = await createClient();

  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('id', notificationId)
    .eq('user_id', user.id);

  if (error) {
    throw new Error(`Failed to delete notification: ${error.message}`);
  }

  revalidatePath('/dashboard');
  return { success: true };
}

/**
 * Create a notification manually (for testing or special cases)
 */
export async function createNotification(
  userId: string,
  type: NotificationType,
  title: string,
  message: string,
  relatedId?: string,
  relatedType?: string
) {
  const user = await requireAuth();
  const supabase = await createClient();

  // Only admins can create arbitrary notifications
  if (user.role !== 'admin') {
    throw new Error('Only administrators can create notifications');
  }

  const { error } = await supabase
    .from('notifications')
    .insert({
      user_id: userId,
      notification_type: type,
      title,
      message,
      related_id: relatedId || null,
      related_type: relatedType || null,
    });

  if (error) {
    throw new Error(`Failed to create notification: ${error.message}`);
  }

  return { success: true };
}

/**
 * Check for overdue action items and create notifications
 */
export async function checkAndNotifyOverdueActionItems() {
  const user = await requireAuth();
  const supabase = await createClient();

  // Only admins can trigger this check
  if (user.role !== 'admin') {
    throw new Error('Only administrators can trigger overdue checks');
  }

  const today = new Date().toISOString().split('T')[0];

  // Get all overdue action items
  const { data: overdueItems } = await supabase
    .from('action_items')
    .select(`
      *,
      one_on_one:one_on_ones(developer_id, manager_id)
    `)
    .lt('due_date', today)
    .in('status', ['pending', 'in_progress']);

  if (!overdueItems || overdueItems.length === 0) {
    return { notificationsSent: 0 };
  }

  let notificationsSent = 0;

  for (const item of overdueItems) {
    const oneOnOne = item.one_on_one as any;
    const assigneeId = item.assigned_to === 'developer'
      ? oneOnOne.developer_id
      : oneOnOne.manager_id;

    // Check if notification already exists for this item
    const { data: existing } = await supabase
      .from('notifications')
      .select('id')
      .eq('related_id', item.id)
      .eq('notification_type', 'action_item_overdue')
      .single();

    if (!existing) {
      await supabase.from('notifications').insert({
        user_id: assigneeId,
        notification_type: 'action_item_overdue',
        title: 'Action Item Overdue',
        message: `Action item is overdue: ${item.description}`,
        related_id: item.id,
        related_type: 'action_item',
      });

      notificationsSent++;
    }
  }

  return { notificationsSent };
}

/**
 * Check for action items due soon and create notifications
 */
export async function checkAndNotifyDueSoonActionItems() {
  const user = await requireAuth();
  const supabase = await createClient();

  // Only admins can trigger this check
  if (user.role !== 'admin') {
    throw new Error('Only administrators can trigger due soon checks');
  }

  const today = new Date();
  const threeDaysFromNow = new Date(today);
  threeDaysFromNow.setDate(today.getDate() + 3);

  const todayStr = today.toISOString().split('T')[0];
  const threeDaysStr = threeDaysFromNow.toISOString().split('T')[0];

  // Get action items due in the next 3 days
  const { data: dueSoonItems } = await supabase
    .from('action_items')
    .select(`
      *,
      one_on_one:one_on_ones(developer_id, manager_id)
    `)
    .gte('due_date', todayStr)
    .lte('due_date', threeDaysStr)
    .in('status', ['pending', 'in_progress']);

  if (!dueSoonItems || dueSoonItems.length === 0) {
    return { notificationsSent: 0 };
  }

  let notificationsSent = 0;

  for (const item of dueSoonItems) {
    const oneOnOne = item.one_on_one as any;
    const assigneeId = item.assigned_to === 'developer'
      ? oneOnOne.developer_id
      : oneOnOne.manager_id;

    // Check if notification already sent today
    const todayStart = new Date(today);
    todayStart.setHours(0, 0, 0, 0);

    const { data: existing } = await supabase
      .from('notifications')
      .select('id')
      .eq('related_id', item.id)
      .eq('notification_type', 'action_item_due_soon')
      .gte('created_at', todayStart.toISOString())
      .single();

    if (!existing) {
      const daysUntilDue = Math.ceil(
        (new Date(item.due_date!).getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      );

      await supabase.from('notifications').insert({
        user_id: assigneeId,
        notification_type: 'action_item_due_soon',
        title: 'Action Item Due Soon',
        message: `Action item due in ${daysUntilDue} day${daysUntilDue !== 1 ? 's' : ''}: ${item.description}`,
        related_id: item.id,
        related_type: 'action_item',
      });

      notificationsSent++;
    }
  }

  return { notificationsSent };
}
