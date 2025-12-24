import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUserProfile } from '@/lib/auth/user-context';
import { signOut } from '@/app/actions/auth';
import { AnalyticsFilters } from '@/components/analytics/analytics-filters';
import {
    getAnalyticsDataForDeveloper,
    getTeamAnalyticsData,
    getOrganizationAnalyticsData
} from '@/app/actions/analytics';
import { AnalyticsFilters as FilterTypes } from '@/lib/types/analytics';
import { getMyNotifications, getUnreadNotificationCount } from '@/app/actions/notifications';
import { NotificationCenter } from '@/components/notifications/notification-center';

export const metadata = {
    title: 'Analytics | 1-on-1 Tracking',
    description: 'Performance and growth analytics',
};

import { DeveloperDeepDive } from '@/components/analytics/developer-deep-dive';

// Placeholder components for Phase 2+
function DeveloperAnalyticsView({ data }: { data: any }) {
    return <DeveloperDeepDive data={data} />;
}

import { ManagerDeepDive } from '@/components/analytics/manager-deep-dive';

function ManagerAnalyticsView({ data }: { data: any }) {
    return <ManagerDeepDive data={data} />;
}

import { OrganizationOverview } from '@/components/analytics/organization-overview';

function AdminAnalyticsView({ data }: { data: any }) {
    return <OrganizationOverview data={data} />;
}

export default async function AnalyticsPage(props: {
    searchParams?: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    const searchParams = await props.searchParams;
    const profile = await getCurrentUserProfile();

    if (!profile) {
        redirect('/');
    }

    const timeRangeParam = searchParams?.timeRange || '6m';
    const timeRange = (timeRangeParam === '3m' ? 3 : timeRangeParam === '12m' ? 12 : 6) as 3 | 6 | 12;
    const filters: FilterTypes = {
        timeRange,
        teamId: typeof searchParams?.teamId === 'string' ? searchParams.teamId : undefined,
    };

    let analyticsData;
    let ViewComponent;

    if (profile.role === 'developer') {
        analyticsData = await getAnalyticsDataForDeveloper(profile.id, filters);
        ViewComponent = DeveloperAnalyticsView;
    } else if (profile.role === 'manager') {
        // If manager has a teamId filter, fetch that team, otherwise fetch their own team(s) context or summary
        // For simplicity in Phase 1, we assume getting manager's "main" analytics
        analyticsData = await getTeamAnalyticsData(filters.teamId || 'my-team', filters);
        ViewComponent = ManagerAnalyticsView;
    } else if (profile.role === 'admin') {
        analyticsData = await getOrganizationAnalyticsData(filters);
        ViewComponent = AdminAnalyticsView;
    } else {
        redirect('/');
    }

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
        <div className="min-h-screen bg-gray-50 pb-12">
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
                                    className="text-sm font-medium text-blue-600 bg-blue-50 px-3 py-2 rounded-md"
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
                <div className="mb-8">
                    <h2 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h2>
                    <p className="text-gray-600 mt-2">
                        {profile.role === 'admin' && 'View organization-wide performance metrics and insights.'}
                        {profile.role === 'manager' && 'Track your team\'s performance and growth trends.'}
                        {profile.role === 'developer' && 'Analyze your professional growth and development progress.'}
                    </p>
                </div>

                <AnalyticsFilters role={profile.role} />

                <Suspense fallback={<div className="text-center py-10">Loading analytics...</div>}>
                    <ViewComponent data={analyticsData} />
                </Suspense>
            </main>
        </div>
    );
}
