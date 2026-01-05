'use client';

import { AppUser, Notification } from '@/lib/types/database';
import { formatDistanceToNow } from 'date-fns';
import { Avatar } from '@/components/ui/avatar';

interface RightSidebarProps {
  userProfile: AppUser;
  notifications: Notification[];
  unreadCount: number;
}

const roleColors = {
  admin: 'bg-purple-100 text-purple-700',
  manager: 'bg-blue-100 text-blue-700',
  developer: 'bg-green-100 text-green-700',
};

const notificationIcons: Record<string, string> = {
  one_on_one_submitted: '📝',
  one_on_one_reviewed: '✓',
  one_on_one_completed: '🎉',
  action_item_assigned: '📌',
  action_item_due_soon: '⏰',
  action_item_overdue: '⚠️',
};

const notificationMessages: Record<string, string> = {
  one_on_one_submitted: 'Submitted 1-on-1 session',
  one_on_one_reviewed: 'Reviewed your 1-on-1',
  one_on_one_completed: 'Completed 1-on-1 session',
  action_item_assigned: 'Assigned new action item',
  action_item_due_soon: 'Action item due soon',
  action_item_overdue: 'Action item overdue',
};

export function RightSidebar({
  userProfile,
  notifications,
  unreadCount,
}: RightSidebarProps) {
  const recentNotifications = notifications.slice(0, 5);

  return (
    <aside className="sidebar-right">
      <div className="flex flex-col h-full p-6">
        {/* User Profile Card */}
        <div className="bg-warmGray-50 rounded-xl p-6 text-center mb-6">
          <div className="relative inline-block mb-4">
            <Avatar
              email={userProfile.email}
              fullName={userProfile.full_name}
              avatarUrl={userProfile.avatar_url}
              size={80}
            />
            <div className="absolute bottom-0 right-0 w-5 h-5 bg-green-500 border-4 border-white rounded-full"></div>
          </div>

          <h3 className="font-bold text-lg text-gray-900 mb-1">
            {userProfile.full_name || 'User'}
          </h3>
          <p className="text-sm text-gray-600 mb-4">@{userProfile.email?.split('@')[0]}</p>

          <span
            className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
              roleColors[userProfile.role]
            }`}
          >
            {userProfile.role.charAt(0).toUpperCase() + userProfile.role.slice(1)}
          </span>
        </div>

        {/* Activity Feed */}
        <div className="flex-1 overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-lg text-gray-900">Activity</h3>
            {/* {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                {unreadCount}
              </span>
            )} */}
          </div>

          <div className="space-y-4">
            {recentNotifications.length > 0 ? (
              recentNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`activity-item ${!notification.is_read ? 'bg-blue-50' : ''}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 text-lg">
                      {notificationIcons[notification.notification_type] || '🔔'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-semibold text-sm text-gray-900 truncate">
                          {notification.title}
                        </p>
                        <span className="text-xs text-gray-500 ml-2 flex-shrink-0">
                          {formatDistanceToNow(new Date(notification.created_at), {
                            addSuffix: true,
                          })}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600">
                        {notification.message ||
                          notificationMessages[notification.notification_type]}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500 text-sm">No recent activity</p>
              </div>
            )}
          </div>

          {notifications.length > 5 && (
            <div className="mt-4 text-center">
              <a
                href="/notifications"
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                View all notifications →
              </a>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
