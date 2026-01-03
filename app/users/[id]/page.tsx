import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUserProfile } from '@/lib/auth/user-context';
import { getUserAnalytics } from '@/app/actions/user-analytics';
import { getMyNotifications, getUnreadNotificationCount } from '@/app/actions/notifications';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Avatar } from '@/components/ui/avatar';
import { UserStatsCards } from '@/components/users/user-stats-cards';
import { UserPerformanceChart } from '@/components/users/user-performance-chart';
import { UserActionItemsList } from '@/components/users/user-action-items-list';
import { UserRecentSessions } from '@/components/users/user-recent-sessions';

export default async function UserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const profile = await getCurrentUserProfile();
  const { id } = await params;

  if (!profile) {
    redirect('/');
  }

  // Check if user has permission to view this profile
  if (profile.role !== 'admin' && profile.id !== id) {
    redirect('/dashboard');
  }

  const [analytics, notifications, unreadCount] = await Promise.all([
    getUserAnalytics(id),
    getMyNotifications(10),
    getUnreadNotificationCount(),
  ]);

  const { user, stats, recentOneOnOnes, performanceMetrics, actionItems } = analytics;

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

  const isOwnProfile = profile.id === id;

  return (
    <DashboardLayout
      userProfile={profile}
      notifications={notifications}
      unreadCount={unreadCount}
      currentPage="dashboard"
    >
      {/* Back Navigation */}
      {profile.role === 'admin' && !isOwnProfile && (
        <div className="mb-6">
          <Link
            href="/dashboard#users"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors text-sm font-medium"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Users
          </Link>
        </div>
      )}

      {/* User Profile Header */}
      <div className="bg-white rounded-xl shadow-sm p-8 mb-6">
        <div className="flex items-start gap-6">
          <Avatar
            email={user.email}
            fullName={user.full_name}
            avatarUrl={user.avatar_url}
            size={96}
          />
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-gray-900">
                {user.full_name || user.email}
              </h1>
              {isOwnProfile && (
                <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm font-medium rounded-full">
                  Your Profile
                </span>
              )}
            </div>
            <p className="text-lg text-gray-600 mb-3">{user.email}</p>
            <div className="flex items-center gap-4">
              <span className={`px-4 py-1.5 text-sm font-medium rounded-full capitalize ${getRoleBadgeColor(user.role)}`}>
                {user.role}
              </span>
              <span className="text-sm text-gray-600">
                Member since {new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <UserStatsCards stats={stats} userRole={user.role} />

      {/* Charts and Lists Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Performance Chart (for developers) */}
        {user.role === 'developer' && performanceMetrics.length > 0 && (
          <UserPerformanceChart metrics={performanceMetrics} />
        )}

        {/* Recent 1-on-1s */}
        <UserRecentSessions sessions={recentOneOnOnes} userRole={user.role} userId={user.id} />
      </div>

      {/* Action Items List */}
      <UserActionItemsList actionItems={actionItems} userRole={user.role} />
    </DashboardLayout>
  );
}
