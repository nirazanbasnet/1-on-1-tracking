import { redirect } from 'next/navigation';
import { getCurrentUserProfile } from '@/lib/auth/user-context';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { getMyNotifications, getUnreadNotificationCount } from '@/app/actions/notifications';

export default async function SettingsPage() {
  const userProfile = await getCurrentUserProfile();

  if (!userProfile) {
    redirect('/sign-in');
  }

  // Only admins can access this page
  if (userProfile.role !== 'admin') {
    redirect('/dashboard');
  }

  const [notifications, unreadCount] = await Promise.all([
    getMyNotifications(),
    getUnreadNotificationCount(),
  ]);

  return (
    <DashboardLayout
      userProfile={userProfile}
      notifications={notifications}
      unreadCount={unreadCount}
      currentPage="dashboard"
      userRole={userProfile.role}
    >
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-sm text-gray-600 mt-1">System configuration and preferences</p>
        </div>

        {/* Settings Content */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Application Information</h2>

          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <span className="text-sm font-medium text-gray-700">Version</span>
              <span className="text-sm text-gray-900">v1.0.0</span>
            </div>

            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <span className="text-sm font-medium text-gray-700">Database Status</span>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <span className="text-sm text-green-600 font-medium">Connected</span>
              </div>
            </div>

            <div className="flex items-center justify-between py-3">
              <span className="text-sm font-medium text-gray-700">Environment</span>
              <span className="text-sm text-gray-900">Production</span>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
