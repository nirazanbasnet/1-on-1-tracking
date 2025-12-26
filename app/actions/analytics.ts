'use server';

import { createClient } from '@/lib/supabase/server';
import { 
  DeveloperAnalytics, 
  TeamAnalytics, 
  OrganizationAnalytics, 
  ActionItemsAnalytics,
  AnalyticsFilters,
  MonthlyMetrics,
  SpiralChartDataPoint
} from '@/lib/types/analytics';
import { addMonths, format, subMonths } from 'date-fns';

export async function getAnalyticsDataForDeveloper(
  developerId: string,
  filters: AnalyticsFilters
): Promise<DeveloperAnalytics> {
  const supabase = await createClient();
  const monthsToLookBack = filters.timeRange || 6;
  const endDate = new Date();
  const startDate = subMonths(endDate, monthsToLookBack);
  const startMonthYear = format(startDate, 'yyyy-MM');

  // Fetch developer info
  const { data: developer } = await supabase
    .from('app_users')
    .select('email, full_name')
    .eq('id', developerId)
    .single();

  // Fetch latest session category scores
  const { data: latestSession } = await supabase
    .from('one_on_ones')
    .select('id, month_year')
    .eq('developer_id', developerId)
    .eq('status', 'completed')
    .order('month_year', { ascending: false })
    .order('session_number', { ascending: false })
    .limit(1)
    .maybeSingle();

  let categoryScores: any = null;
  if (latestSession) {
    const { data: answers } = await supabase
      .from('answers')
      .select(`
        id,
        rating_value,
        question:questions(id, question_text, category)
      `)
      .eq('one_on_one_id', latestSession.id)
      .eq('answer_type', 'developer');

    categoryScores = {
      month_year: latestSession.month_year,
      answers: answers || []
    };
  }

  // Fetch real metrics from database
  const { data: metrics } = await supabase
    .from('metrics_snapshots')
    .select('*')
    .eq('developer_id', developerId)
    .gte('month_year', startMonthYear)
    .order('month_year', { ascending: true });

  // Transform metrics to monthly format
  const monthlyMetrics: MonthlyMetrics[] = (metrics || []).map(m => {
    const metricData = m.metric_data as any;
    return {
      month_year: m.month_year,
      developer_avg_rating: metricData?.developer_avg_rating || null,
      manager_avg_rating: metricData?.manager_avg_rating || null,
      rating_alignment: metricData?.rating_alignment || null,
      completed_action_items: 0, // TODO: Calculate from action_items table
      total_action_items: 0,
      completion_rate: 0,
      one_on_one_count: 1
    };
  });

  // Calculate overall stats from real data
  const hasData = monthlyMetrics.length > 0;
  const avgDevRating = hasData
    ? monthlyMetrics.reduce((sum, m) => sum + (m.developer_avg_rating || 0), 0) / monthlyMetrics.filter(m => m.developer_avg_rating).length
    : null;
  const avgMgrRating = hasData
    ? monthlyMetrics.reduce((sum, m) => sum + (m.manager_avg_rating || 0), 0) / monthlyMetrics.filter(m => m.manager_avg_rating).length
    : null;

  // Calculate trends by comparing recent 3 months to older 3 months
  const calculateTrend = (values: (number | null)[]): 'up' | 'down' | 'stable' => {
    const validValues = values.filter(v => v !== null) as number[];
    if (validValues.length < 2) return 'stable';

    const midpoint = Math.floor(validValues.length / 2);
    const recentAvg = validValues.slice(midpoint).reduce((a, b) => a + b, 0) / validValues.slice(midpoint).length;
    const olderAvg = validValues.slice(0, midpoint).reduce((a, b) => a + b, 0) / validValues.slice(0, midpoint).length;

    const diff = recentAvg - olderAvg;
    if (Math.abs(diff) < 0.1) return 'stable';
    return diff > 0 ? 'up' : 'down';
  };

  const devRatings = monthlyMetrics.map(m => m.developer_avg_rating);
  const mgrRatings = monthlyMetrics.map(m => m.manager_avg_rating);
  const alignments = monthlyMetrics.map(m => m.rating_alignment);

  // Calculate average alignment
  const validAlignments = alignments.filter((a): a is number => a !== null);
  const avgAlignment = hasData && validAlignments.length > 0
    ? validAlignments.reduce((sum, a) => sum + a, 0) / validAlignments.length
    : null;

  return {
    developer_id: developerId,
    developer_name: developer?.full_name || "Developer",
    developer_email: developer?.email || "",
    monthly_metrics: monthlyMetrics,
    category_scores: categoryScores,
    overall_stats: {
      avg_developer_rating: avgDevRating,
      avg_manager_rating: avgMgrRating,
      avg_alignment: avgAlignment,
      total_one_on_ones: monthlyMetrics.length,
      completed_action_items: 0, // TODO: Query action_items table
      total_action_items: 0,
      completion_rate: 0
    },
    trends: {
      developer_rating_trend: calculateTrend(devRatings),
      manager_rating_trend: calculateTrend(mgrRatings),
      alignment_trend: calculateTrend(alignments)
    }
  };
}

export async function getTeamAnalyticsData(
  teamId: string,
  filters: AnalyticsFilters
): Promise<TeamAnalytics> {
  const monthsToLookBack = filters.timeRange || 6;
  const supabase = await createClient();

  // Return empty data - real implementation would query team metrics
  return {
    team_id: teamId,
    team_name: "Team",
    manager_id: "",
    manager_name: "",
    monthly_metrics: [],
    team_members: [],
    overall_stats: {
      avg_team_developer_rating: null,
      avg_team_manager_rating: null,
      avg_team_alignment: null,
      total_one_on_ones: 0,
      avg_completion_rate: null
    }
  };
}

export async function getOrganizationAnalyticsData(
  filters: AnalyticsFilters
): Promise<OrganizationAnalytics> {
  // Return empty data - real implementation would query organization metrics
  return {
    teams: [],
    overall_stats: {
      total_teams: 0,
      total_developers: 0,
      total_one_on_ones: 0,
      avg_org_developer_rating: null,
      avg_org_manager_rating: null,
      avg_org_alignment: null,
      avg_org_completion_rate: null
    },
    top_performers: [],
    needs_attention: []
  };
}

export async function getActionItemsAnalytics(
  scope: 'developer' | 'team' | 'organization',
  id?: string
): Promise<ActionItemsAnalytics> {
  return {
    monthly_data: [],
    by_assignee: [],
    overall_stats: {
      total_items: 0,
      completed_items: 0,
      in_progress_items: 0,
      overdue_items: 0,
      completion_rate: null
    }
  };
}
