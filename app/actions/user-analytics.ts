'use server';

import { createClient } from '@/lib/supabase/server';
import { getCurrentUserProfile } from '@/lib/auth/user-context';

export async function getUserAnalytics(userId: string) {
  const currentUser = await getCurrentUserProfile();

  if (!currentUser) {
    throw new Error('Unauthorized');
  }

  // Only admins and the user themselves can view analytics
  if (currentUser.role !== 'admin' && currentUser.id !== userId) {
    throw new Error('Forbidden');
  }

  const supabase = await createClient();

  // Get user profile (including avatar_url for Google profile pictures)
  const { data: userProfile, error: userError } = await supabase
    .from('app_users')
    .select('*')
    .eq('id', userId)
    .single();

  if (userError || !userProfile) {
    throw new Error('User not found');
  }

  // Get user's team memberships
  const { data: userTeams } = await supabase
    .from('user_teams')
    .select('team_id')
    .eq('user_id', userId);

  const teamIds = userTeams?.map(ut => ut.team_id) || [];

  // Get user's 1-on-1 statistics
  const { data: oneOnOnes } = await supabase
    .from('one_on_ones')
    .select('*')
    .or(`developer_id.eq.${userId},manager_id.eq.${userId}`)
    .order('month_year', { ascending: false });

  // Get metrics for the user (if developer)
  const { data: metrics } = await supabase
    .from('metrics_snapshots')
    .select('*')
    .eq('developer_id', userId)
    .order('month_year', { ascending: false })
    .limit(6);

  // Get action items for one-on-ones where the user is involved
  let allActionItems: any[] = [];
  if (oneOnOnes && oneOnOnes.length > 0) {
    const { data } = await supabase
      .from('action_items')
      .select(`
        *,
        one_on_ones:one_on_one_id (
          month_year,
          developer_id,
          manager_id,
          developer:developer_id (email, full_name),
          manager:manager_id (email, full_name)
        )
      `)
      .in('one_on_one_id', oneOnOnes.map(o => o.id));
    allActionItems = data || [];
  }

  // Filter action items assigned to the user based on their role in each specific 1-on-1
  const actionItems = allActionItems?.filter(item => {
    if (!item.one_on_ones) return false;
    const oneOnOne = Array.isArray(item.one_on_ones) ? item.one_on_ones[0] : item.one_on_ones;

    // If user is the developer in this 1-on-1, include items assigned to developer
    if (oneOnOne.developer_id === userId && item.assigned_to === 'developer') {
      return true;
    }
    // If user is the manager in this 1-on-1, include items assigned to manager
    if (oneOnOne.manager_id === userId && item.assigned_to === 'manager') {
      return true;
    }
    return false;
  }) || [];

  // Calculate statistics
  const totalOneOnOnes = oneOnOnes?.length || 0;
  const completedOneOnOnes = oneOnOnes?.filter(o => o.status === 'completed').length || 0;
  const pendingOneOnOnes = oneOnOnes?.filter(o => o.status === 'submitted' || o.status === 'draft').length || 0;

  const totalActionItems = actionItems?.length || 0;
  const completedActionItems = actionItems?.filter(a => a.status === 'completed').length || 0;
  const pendingActionItems = actionItems?.filter(a => a.status === 'pending' || a.status === 'in_progress').length || 0;
  const overdueActionItems = actionItems?.filter(a =>
    a.status !== 'completed' && a.due_date && new Date(a.due_date) < new Date()
  ).length || 0;

  // Calculate average performance score
  let averageScore = null;
  if (metrics && metrics.length > 0) {
    const scores = metrics
      .map(m => m.average_score)
      .filter(score => score !== null && score !== undefined);

    if (scores.length > 0) {
      averageScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    }
  }

  return {
    user: {
      ...userProfile,
      team_ids: teamIds
    },
    stats: {
      totalOneOnOnes,
      completedOneOnOnes,
      pendingOneOnOnes,
      totalActionItems,
      completedActionItems,
      pendingActionItems,
      overdueActionItems,
      averageScore,
      completionRate: totalOneOnOnes > 0 ? (completedOneOnOnes / totalOneOnOnes) * 100 : 0,
    },
    recentOneOnOnes: oneOnOnes?.slice(0, 5) || [],
    performanceMetrics: metrics || [],
    actionItems: actionItems || [],
  };
}
