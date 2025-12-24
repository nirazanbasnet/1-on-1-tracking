// Analytics-specific type definitions

export interface MonthlyMetrics {
  month_year: string;
  developer_avg_rating: number | null;
  manager_avg_rating: number | null;
  rating_alignment: number | null;
  completed_action_items: number;
  total_action_items: number;
  completion_rate: number | null;
  one_on_one_count: number;
}

export interface DeveloperAnalytics {
  developer_id: string;
  developer_name: string;
  developer_email: string;
  monthly_metrics: MonthlyMetrics[];
  overall_stats: {
    avg_developer_rating: number | null;
    avg_manager_rating: number | null;
    avg_alignment: number | null;
    total_one_on_ones: number;
    completed_action_items: number;
    total_action_items: number;
    completion_rate: number | null;
  };
  trends: {
    developer_rating_trend: 'up' | 'down' | 'stable';
    manager_rating_trend: 'up' | 'down' | 'stable';
    alignment_trend: 'up' | 'down' | 'stable';
  };
}

export interface TeamMemberSummary {
  developer_id: string;
  developer_name: string;
  developer_email: string;
  latest_developer_rating: number | null;
  latest_manager_rating: number | null;
  latest_alignment: number | null;
  total_one_on_ones: number;
  action_items_completion_rate: number | null;
  trend: 'up' | 'down' | 'stable';
}

export interface TeamAnalytics {
  team_id: string;
  team_name: string;
  manager_id: string;
  manager_name: string;
  monthly_metrics: MonthlyMetrics[];
  team_members: TeamMemberSummary[];
  overall_stats: {
    avg_team_developer_rating: number | null;
    avg_team_manager_rating: number | null;
    avg_team_alignment: number | null;
    total_one_on_ones: number;
    avg_completion_rate: number | null;
  };
}

export interface TeamComparison {
  team_id: string;
  team_name: string;
  manager_name: string;
  member_count: number;
  avg_developer_rating: number | null;
  avg_manager_rating: number | null;
  avg_alignment: number | null;
  total_one_on_ones: number;
  completion_rate: number | null;
}

export interface OrganizationAnalytics {
  teams: TeamComparison[];
  overall_stats: {
    total_teams: number;
    total_developers: number;
    total_one_on_ones: number;
    avg_org_developer_rating: number | null;
    avg_org_manager_rating: number | null;
    avg_org_alignment: number | null;
    avg_org_completion_rate: number | null;
  };
  top_performers: TeamMemberSummary[];
  needs_attention: TeamMemberSummary[];
}

export interface ActionItemsAnalytics {
  monthly_data: {
    month_year: string;
    total_items: number;
    completed_items: number;
    overdue_items: number;
    completion_rate: number | null;
  }[];
  by_assignee: {
    assignee_id: string;
    assignee_name: string;
    total_items: number;
    completed_items: number;
    overdue_items: number;
    completion_rate: number | null;
  }[];
  overall_stats: {
    total_items: number;
    completed_items: number;
    in_progress_items: number;
    overdue_items: number;
    completion_rate: number | null;
  };
}

export interface AnalyticsFilters {
  timeRange: 3 | 6 | 12;
  developerId?: string;
  teamId?: string;
  startDate?: string;
  endDate?: string;
}

export type TrendDirection = 'up' | 'down' | 'stable';

export interface ChartDataPoint {
  month: string;
  developerRating?: number | null;
  managerRating?: number | null;
  teamAverage?: number | null;
  alignment?: number | null;
  completionRate?: number | null;
}

export interface SpiralChartDataPoint {
  month: string;
  month_year: string;
  score: number;
  color: string;
  angle: number;
  radius: number;
}

export type SpiralChartData = SpiralChartDataPoint;

export interface MetricTrendData {
  month: string;
  developer: number;
  manager: number;
  teamAverage: number;
}
