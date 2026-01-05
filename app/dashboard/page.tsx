import { redirect } from 'next/navigation';
import { getCurrentUserProfile } from '@/lib/auth/user-context';
import { createClient } from '@/lib/supabase/server';
import { TeamOneOnOnes } from '@/components/manager/team-one-on-ones';
import { MyOneOnOnes } from '@/components/developer/my-one-on-ones';
import { ManagerInfo } from '@/components/developer/manager-info';
import { TeamAnalytics } from '@/components/dashboard/team-analytics';
import { getMyPendingActionItems } from '@/app/actions/action-items';
import { getDeveloperMetricsHistory, getTeamMetrics, getTeamStatistics } from '@/app/actions/metrics';
import { getMyNotifications, getUnreadNotificationCount } from '@/app/actions/notifications';
import { SkillRadarChart } from '@/components/analytics/skill-radar-chart';
import { calculateCategoryScores, formatForRadarChart } from '@/lib/utils/category-analytics';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { MainContentHeader } from '@/components/layout/main-content-header';
import { StatsCards } from '@/components/dashboard/stats-cards';
import { PerformanceChart } from '@/components/dashboard/performance-chart';
import { CurrentTasksList } from '@/components/dashboard/current-tasks-list';
import { format } from 'date-fns';

async function getStats() {
  const supabase = await createClient();

  const [usersResult, teamsResult, questionsResult, oneOnOnesResult, actionItemsResult] = await Promise.all([
    supabase.from('app_users').select('id', { count: 'exact', head: true }),
    supabase.from('teams').select('id', { count: 'exact', head: true }),
    supabase.from('questions').select('id', { count: 'exact', head: true }),
    supabase.from('one_on_ones').select('id, status', { count: 'exact' }),
    supabase.from('action_items').select('id, status', { count: 'exact' }),
  ]);

  const completedOneOnOnes = oneOnOnesResult.data?.filter(o => o.status === 'completed').length || 0;
  const pendingActionItems = actionItemsResult.data?.filter(a => a.status !== 'completed').length || 0;

  return {
    totalUsers: usersResult.count || 0,
    totalTeams: teamsResult.count || 0,
    totalQuestions: questionsResult.count || 0,
    totalOneOnOnes: oneOnOnesResult.count || 0,
    completedOneOnOnes,
    totalActionItems: actionItemsResult.count || 0,
    pendingActionItems,
  };
}

async function getAllUsers() {
  const supabase = await createClient();

  const { data: users } = await supabase
    .from('app_users')
    .select('id, email, full_name, avatar_url, role, created_at, updated_at')
    .order('created_at', { ascending: false });

  if (!users) return [];

  const { data: userTeams } = await supabase
    .from('user_teams')
    .select('user_id, team_id');

  const result = users.map(user => ({
    ...user,
    team_id: null,
    team_ids: userTeams?.filter(ut => ut.user_id === user.id).map(ut => ut.team_id) || []
  }));

  return result;
}

async function getAllTeams() {
  const supabase = await createClient();
  const { data } = await supabase
    .from('teams')
    .select(`
      id,
      name,
      manager_id,
      created_at,
      updated_at,
      manager:app_users!manager_id(id, email, full_name)
    `)
    .order('name');

  return (data || []).map(team => {
    let manager = null;
    if (team.manager) {
      if (Array.isArray(team.manager) && team.manager.length > 0) {
        manager = team.manager[0];
      } else if (!Array.isArray(team.manager)) {
        manager = team.manager;
      }
    }

    return {
      ...team,
      manager
    };
  });
}

async function getManagers() {
  const supabase = await createClient();
  const { data } = await supabase
    .from('app_users')
    .select('id, email, full_name, role, created_at, updated_at')
    .in('role', ['admin', 'manager'])
    .order('full_name');

  return (data || []).map(manager => ({
    ...manager,
    team_id: null
  }));
}

async function getTeamMembersWithOneOnOnes(managerId: string, currentMonth: string) {
  const supabase = await createClient();

  const { data: teams } = await supabase
    .from('teams')
    .select('id, name')
    .eq('manager_id', managerId)
    .order('name');

  if (!teams || teams.length === 0) {
    return { teamInfo: null, members: [] };
  }

  const teamInfo = teams[0];
  const teamIds = teams.map(t => t.id);

  const { data: userTeams } = await supabase
    .from('user_teams')
    .select(`
      user_id,
      team_id,
      app_users!inner (
        id,
        email,
        full_name,
        role
      )
    `)
    .in('team_id', teamIds);

  if (!userTeams || userTeams.length === 0) {
    return { teamInfo, members: [] };
  }

  const uniqueMembersMap = new Map();
  userTeams
    .map(ut => ut.app_users)
    // Include both developers AND managers (managers can also have 1-on-1s)
    .filter((user: any) => user && (user.role === 'developer' || user.role === 'manager'))
    .forEach((user: any) => {
      if (!uniqueMembersMap.has(user.id)) {
        uniqueMembersMap.set(user.id, user);
      }
    });

  const members = Array.from(uniqueMembersMap.values())
    .sort((a: any, b: any) => (a.full_name || a.email).localeCompare(b.full_name || b.email));

  if (members.length === 0) {
    return { teamInfo, members: [] };
  }

  const memberIds = members.map((m: any) => m.id);
  const { data: oneOnOnes } = await supabase
    .from('one_on_ones')
    .select('id, developer_id, month_year, status, session_number, title')
    .in('developer_id', memberIds)
    .order('session_number', { ascending: false });

  const membersWithOneOnOnes = members.map((member: any) => ({
    ...member,
    oneOnOnes: oneOnOnes?.filter(o => o.developer_id === member.id) || [],
  }));

  return {
    teamInfo: {
      ...teamInfo,
      allTeams: teams,
      teamCount: teams.length
    },
    members: membersWithOneOnOnes
  };
}

async function getDeveloperOneOnOnes(developerId: string) {
  const supabase = await createClient();

  const { data } = await supabase
    .from('one_on_ones')
    .select(`
      id,
      month_year,
      status,
      developer_submitted_at,
      manager_reviewed_at,
      completed_at,
      manager:app_users!manager_id(id, email, full_name)
    `)
    .eq('developer_id', developerId)
    .order('month_year', { ascending: false});

  return (data || []).map(oneOnOne => ({
    ...oneOnOne,
    manager: Array.isArray(oneOnOne.manager) && oneOnOne.manager.length > 0 ? oneOnOne.manager[0] : { id: '', email: '', full_name: null }
  }));
}

async function getLatestSessionCategoryScores(developerId: string) {
  const supabase = await createClient();

  const { data: latestSession } = await supabase
    .from('one_on_ones')
    .select('id, month_year')
    .eq('developer_id', developerId)
    .eq('status', 'completed')
    .order('month_year', { ascending: false })
    .order('session_number', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!latestSession) {
    return null;
  }

  const { data: answers } = await supabase
    .from('answers')
    .select(`
      id,
      rating_value,
      question:questions(id, question_text, category)
    `)
    .eq('one_on_one_id', latestSession.id)
    .eq('answer_type', 'developer');

  return {
    month_year: latestSession.month_year,
    answers: answers || []
  };
}

async function getDeveloperManager(developerId: string) {
  const supabase = await createClient();

  const { data: userTeam } = await supabase
    .from('user_teams')
    .select(`
      team_id,
      teams!inner(
        id,
        name,
        manager_id,
        manager:app_users!manager_id(id, email, full_name)
      )
    `)
    .eq('user_id', developerId)
    .limit(1)
    .maybeSingle();

  if (!userTeam) {
    return { manager: null, teamName: null };
  }

  const team = Array.isArray(userTeam.teams) && userTeam.teams.length > 0
    ? userTeam.teams[0]
    : userTeam.teams as any;

  const manager = team?.manager
    ? (Array.isArray(team.manager) && team.manager.length > 0 ? team.manager[0] : team.manager)
    : null;

  return {
    manager: manager || null,
    teamName: team?.name || null
  };
}

export default async function DashboardPage() {
  const profile = await getCurrentUserProfile();

  if (!profile) {
    redirect('/');
  }

  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const stats = await getStats();

  const managerTeamData = profile.role === 'manager'
    ? await getTeamMembersWithOneOnOnes(profile.id, currentMonth)
    : { teamInfo: null, members: [] };

  // Managers can also be developers who have their own 1-on-1s
  const myOneOnOnes = (profile.role === 'developer' || profile.role === 'manager')
    ? await getDeveloperOneOnOnes(profile.id)
    : [];

  const developerManagerInfo = (profile.role === 'developer' || profile.role === 'manager')
    ? await getDeveloperManager(profile.id)
    : { manager: null, teamName: null };

  const latestCategoryScores = (profile.role === 'developer' || profile.role === 'manager')
    ? await getLatestSessionCategoryScores(profile.id)
    : null;

  const pendingActionItems = (profile.role === 'manager' || profile.role === 'developer')
    ? await getMyPendingActionItems()
    : [];

  // Managers can also have their own metrics as developers
  const developerMetrics = (profile.role === 'developer' || profile.role === 'manager')
    ? await getDeveloperMetricsHistory(profile.id, 6)
    : [];

  const teamMetrics = profile.role === 'manager'
    ? await getTeamMetrics(profile.id)
    : [];

  const teamStatistics = profile.role === 'manager'
    ? await getTeamStatistics(profile.id)
    : null;

  const notifications = await getMyNotifications(10);
  const unreadCount = await getUnreadNotificationCount();

  // Prepare stats cards data based on role
  const getStatsCardsData = () => {
    if (profile.role === 'admin') {
      return [
        {
          label: 'Total Users',
          value: stats.totalUsers,
          icon: '👥',
          iconBg: 'bg-blue-50',
        },
        {
          label: 'Active Teams',
          value: stats.totalTeams,
          icon: '🎯',
          iconBg: 'bg-green-50',
        },
        {
          label: '1-on-1s Done',
          value: stats.completedOneOnOnes,
          icon: '✓',
          iconBg: 'bg-purple-50',
        },
      ];
    } else if (profile.role === 'manager') {
      return [
        {
          label: 'Team Size',
          value: managerTeamData.members.length,
          icon: '👥',
          iconBg: 'bg-blue-50',
        },
        {
          label: 'Avg Performance',
          value: teamStatistics?.currentMonthAverage?.toFixed(1) || 'N/A',
          icon: '📊',
          iconBg: 'bg-green-50',
          trend: teamStatistics?.trend ? {
            value: `${Math.abs(teamStatistics.trend)}%`,
            isPositive: teamStatistics.trend > 0,
          } : undefined,
        },
        {
          label: 'Pending Actions',
          value: pendingActionItems.length,
          icon: '⏱',
          iconBg: 'bg-orange-50',
        },
      ];
    } else {
      // Developer
      const avgPerformance = developerMetrics.length > 0
        ? (developerMetrics.reduce((sum: number, m: any) => sum + ((m.metric_data as any)?.developer_avg_rating || 0), 0) / developerMetrics.length).toFixed(1)
        : 'N/A';

      return [
        {
          label: 'Total 1-on-1s',
          value: myOneOnOnes.length,
          icon: '📝',
          iconBg: 'bg-blue-50',
        },
        {
          label: 'Pending Actions',
          value: pendingActionItems.filter((item: any) => item.status !== 'completed').length,
          icon: '⏱',
          iconBg: 'bg-orange-50',
        },
        {
          label: 'Latest Score',
          value: developerMetrics[0]?.average_score?.toFixed(1) || 'N/A',
          icon: '⭐',
          iconBg: 'bg-green-50',
        },
      ];
    }
  };

  // Prepare chart data based on role
  const getChartData = () => {
    if (profile.role === 'developer' && developerMetrics.length > 0) {
      return {
        title: 'My Performance Journey',
        data: developerMetrics.slice(0, 6).reverse().map((m: any) => ({
          month: format(new Date(m.month_year + '-01'), 'MMM'),
          line1: m.metric_data?.developer_avg_rating || 0,
          line2: m.metric_data?.manager_avg_rating || 0,
        })),
        line1Label: 'Self Rating',
        line2Label: 'Manager Rating',
      };
    } else if (profile.role === 'manager' && teamStatistics?.historicalData) {
      return {
        title: 'Team Performance Trend',
        data: teamStatistics.historicalData.slice(0, 6).map((d: any) => ({
          month: format(new Date(d.month_year + '-01'), 'MMM'),
          line1: d.average_score || 0,
          line2: 4.0,
        })),
        line1Label: 'Team Average',
        line2Label: 'Target',
      };
    }
    return null;
  };

  // Calculate completion rate for tasks
  const completionRate = pendingActionItems.length > 0
    ? Math.round((pendingActionItems.filter((item: any) => item.status === 'completed').length / pendingActionItems.length) * 100)
    : 0;

  const userName = profile.full_name || profile.email.split('@')[0];
  const subtitle = profile.role === 'admin'
    ? 'You have full administrative access to manage teams, users, and questions.'
    : profile.role === 'manager'
    ? "Manage your team's 1-on-1s and track their progress."
    : 'Track your monthly 1-on-1s and professional growth.';

  const statsCardsData = getStatsCardsData();
  const chartData = getChartData();

  return (
    <DashboardLayout
      userProfile={profile}
      notifications={notifications}
      unreadCount={unreadCount}
      currentPage="dashboard"
    >
      <MainContentHeader userName={userName} subtitle={subtitle} />

      <StatsCards stats={statsCardsData as any} />

      {chartData && (
        <PerformanceChart
          title={chartData.title}
          data={chartData.data}
          line1Label={chartData.line1Label}
          line2Label={chartData.line2Label}
        />
      )}

      {/* Admin View */}
      {profile.role === 'admin' && (
        <div className="space-y-8">
          {/* Admin Analytics Dashboard */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Organization Overview Card */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-gray-900">Organization Overview</h3>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">👥</span>
                    <span className="text-sm font-medium text-gray-700">Total Users</span>
                  </div>
                  <span className="text-xl font-bold text-gray-900">{stats.totalUsers}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🎯</span>
                    <span className="text-sm font-medium text-gray-700">Active Teams</span>
                  </div>
                  <span className="text-xl font-bold text-gray-900">{stats.totalTeams}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">📝</span>
                    <span className="text-sm font-medium text-gray-700">Total 1-on-1s</span>
                  </div>
                  <span className="text-xl font-bold text-gray-900">{stats.totalOneOnOnes}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">✓</span>
                    <span className="text-sm font-medium text-gray-700">Completed 1-on-1s</span>
                  </div>
                  <span className="text-xl font-bold text-gray-900">{stats.completedOneOnOnes}</span>
                </div>
              </div>
            </div>

            {/* Quick Actions Card */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-gray-900">Quick Actions</h3>
              </div>
              <div className="space-y-3">
                <a
                  href="/teams"
                  className="flex items-center justify-between p-4 bg-gradient-to-r from-indigo-50 to-purple-50 hover:from-indigo-100 hover:to-purple-100 rounded-lg transition-all duration-200 group"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">👥</span>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">Manage Teams</p>
                      <p className="text-xs text-gray-600">Create and organize teams</p>
                    </div>
                  </div>
                  <svg className="w-5 h-5 text-gray-400 group-hover:text-indigo-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </a>
                <a
                  href="/users"
                  className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-cyan-50 hover:from-blue-100 hover:to-cyan-100 rounded-lg transition-all duration-200 group"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">👤</span>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">Manage Users</p>
                      <p className="text-xs text-gray-600">Edit roles and assignments</p>
                    </div>
                  </div>
                  <svg className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </a>
                <a
                  href="/analytics"
                  className="flex items-center justify-between p-4 bg-gradient-to-r from-emerald-50 to-teal-50 hover:from-emerald-100 hover:to-teal-100 rounded-lg transition-all duration-200 group"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">📊</span>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">View Analytics</p>
                      <p className="text-xs text-gray-600">Detailed insights and reports</p>
                    </div>
                  </div>
                  <svg className="w-5 h-5 text-gray-400 group-hover:text-emerald-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </a>
                <a
                  href="/settings"
                  className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-slate-50 hover:from-gray-100 hover:to-slate-100 rounded-lg transition-all duration-200 group"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">⚙️</span>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">System Settings</p>
                      <p className="text-xs text-gray-600">Configure application</p>
                    </div>
                  </div>
                  <svg className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </a>
              </div>
            </div>
          </div>

          {/* Action Items Overview */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Action Items Overview</h3>
                  <p className="text-sm text-gray-600">Track organization-wide tasks</p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-gradient-to-br from-orange-50 to-amber-50 rounded-lg">
                <p className="text-sm font-medium text-gray-600 mb-1">Total Tasks</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalActionItems}</p>
              </div>
              <div className="p-4 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg">
                <p className="text-sm font-medium text-gray-600 mb-1">Pending</p>
                <p className="text-3xl font-bold text-orange-600">{stats.pendingActionItems}</p>
              </div>
              <div className="p-4 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-lg">
                <p className="text-sm font-medium text-gray-600 mb-1">Completed</p>
                <p className="text-3xl font-bold text-emerald-600">{stats.totalActionItems - stats.pendingActionItems}</p>
              </div>
              <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg">
                <p className="text-sm font-medium text-gray-600 mb-1">Completion Rate</p>
                <p className="text-3xl font-bold text-blue-600">
                  {stats.totalActionItems > 0 ? Math.round(((stats.totalActionItems - stats.pendingActionItems) / stats.totalActionItems) * 100) : 0}%
                </p>
              </div>
            </div>
          </div>

          {/* Recent Activity / System Status */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900">System Insights</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 border-l-4 border-indigo-500 bg-indigo-50 rounded">
                <p className="text-sm font-semibold text-indigo-900 mb-1">Questions in System</p>
                <p className="text-2xl font-bold text-indigo-600">{stats.totalQuestions}</p>
                <p className="text-xs text-indigo-600 mt-1">Available for 1-on-1s</p>
              </div>
              <div className="p-4 border-l-4 border-emerald-500 bg-emerald-50 rounded">
                <p className="text-sm font-semibold text-emerald-900 mb-1">Completion Rate</p>
                <p className="text-2xl font-bold text-emerald-600">
                  {stats.totalOneOnOnes > 0 ? Math.round((stats.completedOneOnOnes / stats.totalOneOnOnes) * 100) : 0}%
                </p>
                <p className="text-xs text-emerald-600 mt-1">1-on-1s completed</p>
              </div>
              <div className="p-4 border-l-4 border-purple-500 bg-purple-50 rounded">
                <p className="text-sm font-semibold text-purple-900 mb-1">Avg per User</p>
                <p className="text-2xl font-bold text-purple-600">
                  {stats.totalUsers > 0 ? (stats.totalOneOnOnes / stats.totalUsers).toFixed(1) : '0'}
                </p>
                <p className="text-xs text-purple-600 mt-1">1-on-1s per user</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Manager View */}
      {profile.role === 'manager' && (
        <div className="space-y-8">
          {pendingActionItems.length > 0 && (
            <CurrentTasksList
              tasks={pendingActionItems as any}
              maxItems={7}
              completionRate={completionRate}
            />
          )}

          {/* Manager's Own 1-on-1s (if they have a manager) */}
          {myOneOnOnes.length > 0 && (
            <div className="mb-8">
              <div className="mb-4 pb-3 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900">My 1-on-1 Sessions</h2>
                <p className="text-sm text-gray-600 mt-1">Your sessions with your manager</p>
              </div>

              {developerManagerInfo.manager && (
                <div className="mb-6">
                  <ManagerInfo
                    manager={developerManagerInfo.manager}
                    teamName={developerManagerInfo.teamName}
                  />
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <MyOneOnOnes
                  oneOnOnes={myOneOnOnes}
                  developerId={profile.id}
                  currentMonth={currentMonth}
                />

                {latestCategoryScores && latestCategoryScores.answers.length > 0 && (
                  <a href="/analytics" className="block cursor-pointer group">
                    {(() => {
                      const categoryScores = calculateCategoryScores(latestCategoryScores.answers as any);
                      const radarData = formatForRadarChart(categoryScores);
                      return (
                        <div className="relative">
                          <SkillRadarChart
                            data={radarData}
                            userLabel="My Latest Performance"
                            teamLabel=""
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-5 transition-all rounded-lg flex items-center justify-center">
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white px-4 py-2 rounded-lg shadow-lg">
                              <p className="text-sm font-medium text-gray-900">View Full Analytics →</p>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Team Management Section */}
          <div className="mb-4 pb-3 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">My Team's 1-on-1s</h2>
            <p className="text-sm text-gray-600 mt-1">Manage and review your team members' sessions</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <TeamAnalytics teamMembers={teamMetrics as any} statistics={teamStatistics} />
          </div>
          <TeamOneOnOnes teamMembers={managerTeamData.members} currentMonth={currentMonth} />
        </div>
      )}

      {/* Developer View */}
      {profile.role === 'developer' && (
        <div className="space-y-8">
          {pendingActionItems.length > 0 && (
            <CurrentTasksList
              tasks={pendingActionItems as any}
              maxItems={7}
              completionRate={completionRate}
            />
          )}

          <div className="mb-8">
            <ManagerInfo
              manager={developerManagerInfo.manager}
              teamName={developerManagerInfo.teamName}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <MyOneOnOnes
              oneOnOnes={myOneOnOnes}
              developerId={profile.id}
              currentMonth={currentMonth}
            />

            {latestCategoryScores && latestCategoryScores.answers.length > 0 ? (
              <a href="/analytics" className="block cursor-pointer group">
                {(() => {
                  const categoryScores = calculateCategoryScores(latestCategoryScores.answers as any);
                  const radarData = formatForRadarChart(categoryScores);
                  return (
                    <div className="relative">
                      <SkillRadarChart
                        data={radarData}
                        userLabel="Latest Performance"
                        teamLabel=""
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-5 transition-all rounded-lg flex items-center justify-center">
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white px-4 py-2 rounded-lg shadow-lg">
                          <p className="text-sm font-medium text-gray-900">View Full Analytics →</p>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </a>
            ) : (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Skills Overview</h3>
                <div className="text-center py-8">
                  <p className="text-gray-500 text-sm">Complete a 1-on-1 to see your skills radar chart</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
