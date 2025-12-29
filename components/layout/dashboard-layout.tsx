'use client';

import { AppUser } from '@/lib/types/database';
import { Notification } from '@/lib/types/database';
import { LeftSidebar } from './left-sidebar';
import { RightSidebar } from './right-sidebar';

interface DashboardLayoutProps {
  children: React.ReactNode;
  userProfile: AppUser;
  notifications: Notification[];
  unreadCount: number;
  currentPage?: 'dashboard' | 'analytics';
}

export function DashboardLayout({
  children,
  userProfile,
  notifications,
  unreadCount,
  currentPage = 'dashboard',
}: DashboardLayoutProps) {
  return (
    <div className="dashboard-container">
      {/* Left Sidebar - Navigation */}
      <LeftSidebar currentPage={currentPage} userRole={userProfile.role} />

      {/* Main Content Area */}
      <main className="main-content">{children}</main>

      {/* Right Sidebar - Activity Feed */}
      <RightSidebar
        userProfile={userProfile}
        notifications={notifications}
        unreadCount={unreadCount}
      />
    </div>
  );
}
