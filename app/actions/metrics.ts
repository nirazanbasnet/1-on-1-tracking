'use server';

import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/auth/user-context';

/**
 * Calculate metrics for a specific 1-on-1 and create a snapshot
 */
export async function calculateAndSaveMetrics(oneOnOneId: string) {
  const user = await requireAuth();
  const supabase = await createClient();

  // Get the 1-on-1
  const { data: oneOnOne } = await supabase
    .from('one_on_ones')
    .select('id, developer_id, manager_id, team_id, month_year, status')
    .eq('id', oneOnOneId)
    .single();

  if (!oneOnOne) {
    throw new Error('1-on-1 not found');
  }

  // Only calculate metrics for completed 1-on-1s
  if (oneOnOne.status !== 'completed') {
    return null;
  }

  // Get all answers with questions
  const { data: answers } = await supabase
    .from('answers')
    .select(`
      id,
      rating_value,
      text_value,
      answer_type,
      question:questions(id, question_text, question_type)
    `)
    .eq('one_on_one_id', oneOnOneId);

  if (!answers || answers.length === 0) {
    return null;
  }

  // Calculate average ratings
  const ratingAnswers = answers.filter(a => a.rating_value !== null);
  const averageScore = ratingAnswers.length > 0
    ? ratingAnswers.reduce((sum, a) => sum + (a.rating_value || 0), 0) / ratingAnswers.length
    : null;

  // Calculate developer vs manager rating difference
  const developerRatings = ratingAnswers.filter(a => a.answer_type === 'developer');
  const managerRatings = ratingAnswers.filter(a => a.answer_type === 'manager');

  const avgDeveloperRating = developerRatings.length > 0
    ? developerRatings.reduce((sum, a) => sum + (a.rating_value || 0), 0) / developerRatings.length
    : null;

  const avgManagerRating = managerRatings.length > 0
    ? managerRatings.reduce((sum, a) => sum + (a.rating_value || 0), 0) / managerRatings.length
    : null;

  // Build metric data
  const metricData = {
    total_questions: answers.length / 2, // Divided by 2 because each question has 2 answers
    rating_questions: ratingAnswers.length / 2,
    developer_avg_rating: avgDeveloperRating,
    manager_avg_rating: avgManagerRating,
    rating_alignment: avgDeveloperRating && avgManagerRating
      ? Math.abs(avgDeveloperRating - avgManagerRating)
      : null,
  };

  // Check if snapshot already exists
  const { data: existing } = await supabase
    .from('metrics_snapshots')
    .select('id')
    .eq('one_on_one_id', oneOnOneId)
    .single();

  if (existing) {
    // Update existing snapshot
    const { error } = await supabase
      .from('metrics_snapshots')
      .update({
        average_score: averageScore,
        metric_data: metricData,
      })
      .eq('id', existing.id);

    if (error) {
      throw new Error(`Failed to update metrics: ${error.message}`);
    }
  } else {
    // Create new snapshot
    const { error } = await supabase
      .from('metrics_snapshots')
      .insert({
        one_on_one_id: oneOnOneId,
        developer_id: oneOnOne.developer_id,
        team_id: oneOnOne.team_id,
        month_year: oneOnOne.month_year,
        average_score: averageScore,
        metric_data: metricData,
      });

    if (error) {
      throw new Error(`Failed to create metrics: ${error.message}`);
    }
  }

  return { averageScore, metricData };
}

/**
 * Get metrics history for a developer
 */
export async function getDeveloperMetricsHistory(developerId: string, limit: number = 12) {
  const user = await requireAuth();
  const supabase = await createClient();

  // Check permissions
  const isOwnProfile = user.id === developerId;
  const isManager = user.role === 'manager';
  const isAdmin = user.role === 'admin';

  if (!isOwnProfile && !isManager && !isAdmin) {
    throw new Error('You do not have permission to view these metrics');
  }

  // If manager, verify they manage this developer (using user_teams table)
  if (isManager && !isOwnProfile) {
    const { data: team } = await supabase
      .from('teams')
      .select('id')
      .eq('manager_id', user.id)
      .single();

    if (!team) {
      throw new Error('You do not have permission to view these metrics');
    }

    // Check if developer is in the manager's team
    const { data: membership } = await supabase
      .from('user_teams')
      .select('id')
      .eq('user_id', developerId)
      .eq('team_id', team.id)
      .maybeSingle();

    if (!membership) {
      throw new Error('You do not have permission to view these metrics');
    }
  }

  const { data, error } = await supabase
    .from('metrics_snapshots')
    .select('*')
    .eq('developer_id', developerId)
    .order('month_year', { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to fetch metrics: ${error.message}`);
  }

  return data || [];
}

/**
 * Get team-wide metrics for a manager
 */
export async function getTeamMetrics(managerId: string) {
  const user = await requireAuth();
  const supabase = await createClient();

  // Check permissions
  const isOwnProfile = user.id === managerId;
  const isAdmin = user.role === 'admin';

  if (!isOwnProfile && !isAdmin) {
    throw new Error('You do not have permission to view these metrics');
  }

  // Get the manager's team
  const { data: team } = await supabase
    .from('teams')
    .select('id')
    .eq('manager_id', managerId)
    .single();

  if (!team) {
    return [];
  }

  // Get all team members
  const { data: members } = await supabase
    .from('app_users')
    .select('id, full_name, email')
    .eq('team_id', team.id)
    .eq('role', 'developer');

  if (!members || members.length === 0) {
    return [];
  }

  const memberIds = members.map(m => m.id);

  // Get recent metrics for all team members
  const { data: metrics, error } = await supabase
    .from('metrics_snapshots')
    .select('*')
    .in('developer_id', memberIds)
    .order('month_year', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch team metrics: ${error.message}`);
  }

  // Group metrics by developer
  const metricsMap = new Map();
  metrics?.forEach(metric => {
    if (!metricsMap.has(metric.developer_id)) {
      metricsMap.set(metric.developer_id, []);
    }
    metricsMap.get(metric.developer_id).push(metric);
  });

  // Combine with member info
  return members.map(member => ({
    ...member,
    metrics: metricsMap.get(member.id) || [],
    latestMetric: metricsMap.get(member.id)?.[0] || null,
  }));
}

/**
 * Get overall team statistics
 */
export async function getTeamStatistics(managerId: string) {
  const user = await requireAuth();
  const supabase = await createClient();

  // Check permissions
  const isOwnProfile = user.id === managerId;
  const isAdmin = user.role === 'admin';

  if (!isOwnProfile && !isAdmin) {
    throw new Error('You do not have permission to view these metrics');
  }

  // Get the manager's team
  const { data: team } = await supabase
    .from('teams')
    .select('id')
    .eq('manager_id', managerId)
    .single();

  if (!team) {
    return null;
  }

  // Get current month
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  // Get metrics for current month
  const { data: currentMetrics } = await supabase
    .from('metrics_snapshots')
    .select('average_score, metric_data')
    .eq('team_id', team.id)
    .eq('month_year', currentMonth);

  // Get metrics for last 6 months
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  const sixMonthsAgoStr = `${sixMonthsAgo.getFullYear()}-${String(sixMonthsAgo.getMonth() + 1).padStart(2, '0')}`;

  const { data: historicalMetrics } = await supabase
    .from('metrics_snapshots')
    .select('average_score, month_year')
    .eq('team_id', team.id)
    .gte('month_year', sixMonthsAgoStr)
    .order('month_year', { ascending: true });

  // Calculate statistics
  const teamAverage = currentMetrics && currentMetrics.length > 0
    ? currentMetrics.reduce((sum, m) => sum + (m.average_score || 0), 0) / currentMetrics.length
    : null;

  const alignmentScores = currentMetrics
    ?.map(m => (m.metric_data as any)?.rating_alignment)
    .filter(a => a !== null) || [];

  const avgAlignment = alignmentScores.length > 0
    ? alignmentScores.reduce((sum: number, a: number) => sum + a, 0) / alignmentScores.length
    : null;

  // Calculate trend (comparing current to 3 months ago)
  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
  const threeMonthsAgoStr = `${threeMonthsAgo.getFullYear()}-${String(threeMonthsAgo.getMonth() + 1).padStart(2, '0')}`;

  const { data: pastMetrics } = await supabase
    .from('metrics_snapshots')
    .select('average_score')
    .eq('team_id', team.id)
    .eq('month_year', threeMonthsAgoStr);

  const pastAverage = pastMetrics && pastMetrics.length > 0
    ? pastMetrics.reduce((sum, m) => sum + (m.average_score || 0), 0) / pastMetrics.length
    : null;

  const trend = teamAverage && pastAverage
    ? ((teamAverage - pastAverage) / pastAverage) * 100
    : null;

  return {
    currentMonthAverage: teamAverage,
    averageAlignment: avgAlignment,
    trend,
    historicalData: historicalMetrics || [],
    totalSnapshots: currentMetrics?.length || 0,
  };
}
