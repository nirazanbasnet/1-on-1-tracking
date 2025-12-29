import { redirect } from 'next/navigation';
import { getCurrentUserProfile } from '@/lib/auth/user-context';
import { createClient } from '@/lib/supabase/server';
import { UserCard } from '@/components/admin/user-card';
import { TeamManagement } from '@/components/admin/team-management';
import { TeamOneOnOnes } from '@/components/manager/team-one-on-ones';
import { MyOneOnOnes } from '@/components/developer/my-one-on-ones';
import { ManagerInfo } from '@/components/developer/manager-info';
import { PendingActionItems } from '@/components/dashboard/pending-action-items';
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
    .select('id, email, full_name, role, created_at, updated_at')
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
    .filter((user: any) => user && user.role === 'developer')
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
  const teams = profile.role === 'admin' ? await getAllTeams() : [];
  const managers = profile.role === 'admin' ? await getManagers() : [];
  const users = profile.role === 'admin' ? await getAllUsers() : [];

  const managerTeamData = profile.role === 'manager'
    ? await getTeamMembersWithOneOnOnes(profile.id, currentMonth)
    : { teamInfo: null, members: [] };

  const myOneOnOnes = profile.role === 'developer'
    ? await getDeveloperOneOnOnes(profile.id)
    : [];

  const developerManagerInfo = profile.role === 'developer'
    ? await getDeveloperManager(profile.id)
    : { manager: null, teamName: null };

  const latestCategoryScores = profile.role === 'developer'
    ? await getLatestSessionCategoryScores(profile.id)
    : null;

  const pendingActionItems = (profile.role === 'manager' || profile.role === 'developer')
    ? await getMyPendingActionItems()
    : [];

  const developerMetrics = profile.role === 'developer'
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
        <>
          <div className="mb-8">
            <TeamManagement teams={teams} managers={managers} allUsers={users} />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">All Users</h3>
                <p className="text-sm text-gray-600 mt-1">{users.length} user{users.length !== 1 ? 's' : ''} total</p>
              </div>
            </div>

            {users.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-12">
                <div className="flex flex-col items-center text-center">
                  <svg className="w-16 h-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  <p className="text-lg font-medium text-gray-900 mb-2">No users found</p>
                  <p className="text-sm text-gray-500">Users will appear here after they sign up</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {users.map((user) => (
                  <UserCard
                    key={user.id}
                    user={user}
                    teams={teams}
                    currentUserId={profile.id}
                  />
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Manager View */}
      {profile.role === 'manager' && (
        <div className="space-y-8">
          {(profile.role === 'manager' || profile.role === 'developer') && pendingActionItems.length > 0 && (
            <CurrentTasksList
              tasks={pendingActionItems as any}
              maxItems={7}
              completionRate={completionRate}
            />
          )}

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
