import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUserProfile } from '@/lib/auth/user-context';
import { AnalyticsFilters } from '@/components/analytics/analytics-filters';
import {
    getAnalyticsDataForDeveloper,
    getTeamAnalyticsData,
    getOrganizationAnalyticsData
} from '@/app/actions/analytics';
import { AnalyticsFilters as FilterTypes } from '@/lib/types/analytics';
import { getMyNotifications, getUnreadNotificationCount } from '@/app/actions/notifications';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { MainContentHeader } from '@/components/layout/main-content-header';
import { DeveloperDeepDive } from '@/components/analytics/developer-deep-dive';
import { ManagerDeepDive } from '@/components/analytics/manager-deep-dive';
import { OrganizationOverview } from '@/components/analytics/organization-overview';

export const metadata = {
    title: 'Analytics | 1-on-1 Tracking',
    description: 'Performance and growth analytics',
};

// View components
function DeveloperAnalyticsView({ data }: { data: any }) {
    return <DeveloperDeepDive data={data} />;
}

function ManagerAnalyticsView({ data }: { data: any }) {
    return <ManagerDeepDive data={data} />;
}

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

    const userName = profile.full_name || profile.email.split('@')[0];
    const subtitle = profile.role === 'admin'
        ? 'Organization-wide performance metrics.'
        : profile.role === 'manager'
        ? 'Team performance and growth trends.'
        : 'Professional growth and development.';

    return (
        <DashboardLayout
            userProfile={profile}
            notifications={notifications}
            unreadCount={unreadCount}
            currentPage="analytics"
        >
            <MainContentHeader userName={userName} subtitle={subtitle} />

            <div className="space-y-6">
                <AnalyticsFilters role={profile.role} />

                <Suspense fallback={
                    <div className="bg-white rounded-xl shadow-sm p-12">
                        <div className="text-center">
                            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                            <p className="text-sm text-gray-500">Loading analytics data...</p>
                        </div>
                    </div>
                }>
                    <ViewComponent data={analyticsData} />
                </Suspense>
            </div>
        </DashboardLayout>
    );
}
