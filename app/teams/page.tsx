import { redirect } from 'next/navigation';
import { getCurrentUserProfile } from '@/lib/auth/user-context';
import { createClient } from '@/lib/supabase/server';
import { TeamManagement } from '@/components/admin/team-management';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { getMyNotifications, getUnreadNotificationCount } from '@/app/actions/notifications';

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
    .select('id, email, full_name, avatar_url, role, created_at, updated_at')
    .in('role', ['admin', 'manager'])
    .order('full_name');

  return (data || []).map(manager => ({
    ...manager,
    team_id: null
  }));
}

async function getAllUsers() {
  const supabase = await createClient();

  const { data: users } = await supabase
    .from('app_users')
    .select('id, email, full_name, avatar_url, role, created_at, updated_at')
    .order('full_name');

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

export default async function TeamsPage() {
  const userProfile = await getCurrentUserProfile();

  if (!userProfile) {
    redirect('/sign-in');
  }

  // Only admins can access this page
  if (userProfile.role !== 'admin') {
    redirect('/dashboard');
  }

  const [teams, managers, allUsers, notifications, unreadCount] = await Promise.all([
    getAllTeams(),
    getManagers(),
    getAllUsers(),
    getMyNotifications(),
    getUnreadNotificationCount(),
  ]);

  return (
    <DashboardLayout
      userProfile={userProfile}
      notifications={notifications}
      unreadCount={unreadCount}
      currentPage="dashboard"
    >
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Team Management</h1>
          <p className="text-sm text-gray-600 mt-1">Create and manage teams, assign managers</p>
        </div>

        {/* Team Management Component */}
        <TeamManagement teams={teams} managers={managers} allUsers={allUsers} />
      </div>
    </DashboardLayout>
  );
}
