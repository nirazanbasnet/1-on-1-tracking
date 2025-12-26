'use client';

import { OrganizationAnalytics } from '@/lib/types/analytics';
import { StatsCards } from './stats-cards';
import { TeamComparisonChart } from './team-comparison-chart';
import { TeamPerformanceGrid } from './team-performance-grid';

interface OrganizationOverviewProps {
    data: OrganizationAnalytics;
}

export function OrganizationOverview({ data }: OrganizationOverviewProps) {
    // Check if there's any organization data
    const hasData = data.teams && data.teams.length > 0 && data.overall_stats.total_one_on_ones > 0;

    if (!hasData) {
        return (
            <div className="bg-white p-12 rounded-lg shadow-sm border border-gray-100 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Organization Analytics Data Yet</h3>
                <p className="text-gray-600 mb-4">No teams have completed 1-on-1s yet. Organization-wide analytics will appear once teams start their sessions.</p>
                <a
                    href="/dashboard"
                    className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                    Go to Dashboard
                </a>
            </div>
        );
    }

    const stats = [
        {
            label: 'Avg Org Rating',
            value: data.overall_stats.avg_org_developer_rating?.toFixed(1) || 'N/A',
            trend: 'up' as const, // derive
        },
        {
            label: 'Engagement',
            value: `${((data.overall_stats.avg_org_completion_rate || 0) * 100).toFixed(0)}%`,
            trend: 'stable' as const,
        },
        {
            label: 'Total Teams',
            value: data.overall_stats.total_teams,
        },
        {
            label: 'Total 1-on-1s',
            value: data.overall_stats.total_one_on_ones,
        }
    ];

    return (
        <div className="space-y-6">
            <StatsCards stats={stats} />

            <TeamComparisonChart teams={data.teams} />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-4 px-1">Top Performers</h3>
                    <TeamPerformanceGrid members={data.top_performers} />
                </div>
                <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-4 px-1">Needs Attention</h3>
                    <TeamPerformanceGrid members={data.needs_attention} />
                </div>
            </div>
        </div>
    );
}
