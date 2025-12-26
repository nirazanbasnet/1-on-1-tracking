'use client';

import { TeamAnalytics } from '@/lib/types/analytics';
import { TeamPerformanceGrid } from './team-performance-grid';
import { ComparativeChart } from './comparative-chart';
import { TeamPerformanceArea } from './team-performance-area';
import { StatsCards } from './stats-cards';

interface ManagerDeepDiveProps {
    data: TeamAnalytics;
}

export function ManagerDeepDive({ data }: ManagerDeepDiveProps) {
    // Check if there's any team data
    const hasData = data.team_members && data.team_members.length > 0 && data.overall_stats.total_one_on_ones > 0;

    if (!hasData) {
        return (
            <div className="bg-white p-12 rounded-lg shadow-sm border border-gray-100 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Team Analytics Data Yet</h3>
                <p className="text-gray-600 mb-4">Your team hasn't completed any 1-on-1s yet. Analytics will appear once team members start completing their sessions.</p>
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
            label: 'Team Avg Rating',
            value: data.overall_stats.avg_team_developer_rating?.toFixed(1) || 'N/A',
            trend: 'stable' as const, // derive
        },
        {
            label: 'Manager Avg Rating',
            value: data.overall_stats.avg_team_manager_rating?.toFixed(1) || 'N/A',
            trend: 'stable' as const,
        },
        {
            label: 'Action Items Rate',
            value: `${((data.overall_stats.avg_completion_rate || 0) * 100).toFixed(0)}%`,
            trend: 'up' as const,
        },
        {
            label: 'Total 1-on-1s',
            value: data.overall_stats.total_one_on_ones,
        }
    ];

    return (
        <div className="space-y-6">
            <StatsCards stats={stats} />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <TeamPerformanceArea metrics={data.monthly_metrics} />
                <ComparativeChart members={data.team_members} />
            </div>

            <TeamPerformanceGrid members={data.team_members} />
        </div>
    );
}
