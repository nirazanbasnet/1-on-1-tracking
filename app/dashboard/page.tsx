import { redirect } from 'next/navigation';
import { signOut } from '@/app/actions/auth';
import { getCurrentUserProfile } from '@/lib/auth/user-context';
import { createClient } from '@/lib/supabase/server';
import { UserManagementRow } from '@/components/admin/user-management-row';
import { TeamManagement } from '@/components/admin/team-management';
import { TeamOneOnOnes } from '@/components/manager/team-one-on-ones';
import { MyOneOnOnes } from '@/components/developer/my-one-on-ones';
import { PendingActionItems } from '@/components/dashboard/pending-action-items';
import { DeveloperProgress } from '@/components/dashboard/developer-progress';
import { TeamAnalytics } from '@/components/dashboard/team-analytics';
import { getMyPendingActionItems } from '@/app/actions/action-items';
import { getDeveloperMetricsHistory, getTeamMetrics, getTeamStatistics } from '@/app/actions/metrics';
import { getMyNotifications, getUnreadNotificationCount } from '@/app/actions/notifications';
import { NotificationCenter } from '@/components/notifications/notification-center';

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

  // Fetch all users
  const { data: users } = await supabase
    .from('app_users')
    .select('id, email, full_name, role, team_id, created_at, updated_at')
    .order('created_at', { ascending: false });

  if (!users) return [];

  // Fetch team assignments for all users
  const { data: userTeams } = await supabase
    .from('user_teams')
    .select('user_id, team_id');

  // Map team_ids to users
  return users.map(user => ({
    ...user,
    team_ids: userTeams?.filter(ut => ut.user_id === user.id).map(ut => ut.team_id) || []
  }));
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
      manager:app_users!manager_id(email, full_name)
    `)
    .order('name');

  // Transform manager from array to single object (Supabase returns foreign keys as arrays)
  return (data || []).map(team => ({
    ...team,
    manager: Array.isArray(team.manager) && team.manager.length > 0 ? team.manager[0] : null
  }));
}

async function getManagers() {
  const supabase = await createClient();
  const { data } = await supabase
    .from('app_users')
    .select('id, email, full_name, role, team_id, created_at, updated_at')
    .in('role', ['admin', 'manager'])
    .order('full_name');
  return data || [];
}

async function getTeamMembersWithOneOnOnes(managerId: string, currentMonth: string) {
  const supabase = await createClient();

  // Get ALL teams managed by this manager (supports managing multiple teams)
  const { data: teams } = await supabase
    .from('teams')
    .select('id, name')
    .eq('manager_id', managerId)
    .order('name');

  if (!teams || teams.length === 0) {
    return { teamInfo: null, members: [] };
  }

  // Use the first team for display (or could combine all teams)
  const teamInfo = teams[0];
  const teamIds = teams.map(t => t.id);

  // Get all team members from ALL managed teams through user_teams junction table
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

  // Filter for developers only and flatten the structure (remove duplicates)
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

  // Get 1-on-1s for these team members
  const memberIds = members.map((m: any) => m.id);
  const { data: oneOnOnes } = await supabase
    .from('one_on_ones')
    .select('id, developer_id, month_year, status')
    .in('developer_id', memberIds);

  // Attach 1-on-1s to members
  const membersWithOneOnOnes = members.map((member: any) => ({
    ...member,
    oneOnOnes: oneOnOnes?.filter(o => o.developer_id === member.id) || [],
  }));

  // Return with info about all managed teams
  return {
    teamInfo: {
      ...teamInfo,
      allTeams: teams, // Include all teams for display
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
    .order('month_year', { ascending: false });

  // Transform manager from array to single object (Supabase returns foreign keys as arrays)
  return (data || []).map(oneOnOne => ({
    ...oneOnOne,
    manager: Array.isArray(oneOnOne.manager) && oneOnOne.manager.length > 0 ? oneOnOne.manager[0] : { id: '', email: '', full_name: null }
  }));
}

export default async function DashboardPage() {
  const profile = await getCurrentUserProfile();

  if (!profile) {
    redirect('/');
  }

  // Get current month in YYYY-MM format
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const stats = await getStats();
  const users = profile.role === 'admin' ? await getAllUsers() : [];
  const teams = profile.role === 'admin' ? await getAllTeams() : [];
  const managers = profile.role === 'admin' ? await getManagers() : [];

  // Manager data
  const managerTeamData = profile.role === 'manager'
    ? await getTeamMembersWithOneOnOnes(profile.id, currentMonth)
    : { teamInfo: null, members: [] };

  // Developer data
  const myOneOnOnes = profile.role === 'developer'
    ? await getDeveloperOneOnOnes(profile.id)
    : [];

  // Action items for managers and developers
  const pendingActionItems = (profile.role === 'manager' || profile.role === 'developer')
    ? await getMyPendingActionItems()
    : [];

  // Metrics for developers
  const developerMetrics = profile.role === 'developer'
    ? await getDeveloperMetricsHistory(profile.id, 6)
    : [];

  // Metrics for managers
  const teamMetrics = profile.role === 'manager'
    ? await getTeamMetrics(profile.id)
    : [];

  const teamStatistics = profile.role === 'manager'
    ? await getTeamStatistics(profile.id)
    : null;

  // Notifications
  const notifications = await getMyNotifications(10);
  const unreadCount = await getUnreadNotificationCount();

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-100 text-purple-800';
      case 'manager':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-green-100 text-green-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-8">
              <h1 className="text-xl font-semibold text-gray-900">
                1-on-1 Tracking Platform
              </h1>
              <div className="hidden md:flex items-center gap-4">
                <a
                  href="/dashboard"
                  className="text-sm font-medium text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md hover:bg-gray-100 transition-colors"
                >
                  Dashboard
                </a>
                <a
                  href="/analytics"
                  className="text-sm font-medium text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md hover:bg-gray-100 transition-colors"
                >
                  Analytics
                </a>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <NotificationCenter
                initialNotifications={notifications}
                initialUnreadCount={unreadCount}
              />
              <div className="text-sm">
                <span className="font-medium text-gray-900">{profile.full_name || profile.email}</span>
                <span className={`ml-2 px-2 py-1 text-xs font-medium rounded-full ${getRoleBadgeColor(profile.role)}`}>
                  {profile.role.toUpperCase()}
                </span>
              </div>
              <form action={signOut}>
                <button
                  type="submit"
                  className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium"
                >
                  Sign Out
                </button>
              </form>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900">
            Welcome back, {profile.full_name || profile.email.split('@')[0]}!
          </h2>
          <p className="text-gray-600 mt-2">
            {profile.role === 'admin' && 'You have full administrative access to manage teams, users, and questions.'}
            {profile.role === 'manager' && 'Manage your team\'s 1-on-1s and track their progress.'}
            {profile.role === 'developer' && 'Track your monthly 1-on-1s and professional growth.'}
          </p>
        </div>

        {/* Admin View */}
        {profile.role === 'admin' && (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600">Total Users</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalUsers}</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600">Active Teams</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalTeams}</p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600">1-on-1s Completed</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{stats.completedOneOnOnes}</p>
                    <p className="text-xs text-gray-500 mt-1">of {stats.totalOneOnOnes} total</p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600">Pending Actions</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{stats.pendingActionItems}</p>
                    <p className="text-xs text-gray-500 mt-1">of {stats.totalActionItems} total</p>
                  </div>
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Teams Management */}
            <div className="mb-8">
              <TeamManagement teams={teams} managers={managers} allUsers={users} />
            </div>

            {/* Users Management */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">All Users</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Teams</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users.map((user) => (
                      <UserManagementRow
                        key={user.id}
                        user={user}
                        teams={teams}
                        currentUserId={profile.id}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* Manager View */}
        {profile.role === 'manager' && (
          <div className="space-y-8">
            {/* Team Info Card */}
            {managerTeamData.teamInfo ? (
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg shadow-lg p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold mb-1">
                      Managing {(managerTeamData.teamInfo as any).teamCount > 1 ? 'Teams' : 'Team'}
                    </h3>
                    {(managerTeamData.teamInfo as any).allTeams && (managerTeamData.teamInfo as any).allTeams.length > 1 ? (
                      <div>
                        <p className="text-xl font-bold mb-2">
                          {(managerTeamData.teamInfo as any).allTeams.length} Teams
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {(managerTeamData.teamInfo as any).allTeams.map((team: any) => (
                            <span key={team.id} className="px-3 py-1 bg-white bg-opacity-20 rounded-full text-sm">
                              {team.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <p className="text-2xl font-bold">{managerTeamData.teamInfo.name}</p>
                    )}
                    <p className="text-blue-100 mt-2">
                      {managerTeamData.members.length} {managerTeamData.members.length === 1 ? 'team member' : 'team members'}
                    </p>
                  </div>
                  <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                <div className="flex items-start">
                  <svg className="w-6 h-6 text-yellow-600 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div>
                    <h3 className="text-lg font-semibold text-yellow-900 mb-1">No Team Assigned</h3>
                    <p className="text-yellow-700">
                      You are not assigned as a manager of any team yet. Please contact an administrator to set up your team.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <PendingActionItems actionItems={pendingActionItems as any} userRole="manager" />
              <TeamAnalytics teamMembers={teamMetrics as any} statistics={teamStatistics} />
            </div>
            <TeamOneOnOnes teamMembers={managerTeamData.members} currentMonth={currentMonth} />
          </div>
        )}

        {/* Developer View */}
        {profile.role === 'developer' && (
          <div className="space-y-8">
            {/* Quick Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total 1-on-1s</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{myOneOnOnes.length}</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Pending Actions</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">
                      {pendingActionItems.filter((item: any) => item.status !== 'completed').length}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Avg Performance</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">
                      {developerMetrics.length > 0
                        ? (developerMetrics.reduce((sum: number, m: any) => sum + ((m.metric_data as any)?.developer_avg_rating || 0), 0) / developerMetrics.length).toFixed(1)
                        : 'N/A'}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <PendingActionItems actionItems={pendingActionItems as any} userRole="developer" />
              <DeveloperProgress
                metrics={developerMetrics}
                developerName={profile.full_name || profile.email}
              />
            </div>
            <MyOneOnOnes
              oneOnOnes={myOneOnOnes}
              developerId={profile.id}
              currentMonth={currentMonth}
            />
          </div>
        )}
      </main>
    </div>
  );
}
