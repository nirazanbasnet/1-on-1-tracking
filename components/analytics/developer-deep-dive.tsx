'use client';

import { DeveloperAnalytics } from '@/lib/types/analytics';
import { SpiralProgressChart } from './spiral-progress-chart';
import { MetricsTrendChart } from './metrics-trend-chart';
import { StatsCards } from './stats-cards';
import { format } from 'date-fns';

interface DeveloperDeepDiveProps {
    data: DeveloperAnalytics;
}

export function DeveloperDeepDive({ data }: DeveloperDeepDiveProps) {
    // Check if there's any data
    const hasData = data.monthly_metrics && data.monthly_metrics.length > 0;

    if (!hasData) {
        return (
            <div className="bg-white p-12 rounded-lg shadow-sm border border-gray-100 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Analytics Data Yet</h3>
                <p className="text-gray-600 mb-4">Complete your first 1-on-1 to see your analytics and growth trends.</p>
                <a
                    href="/dashboard"
                    className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                    Go to Dashboard
                </a>
            </div>
        );
    }

    // Transform data for charts
    const spiralData = data.monthly_metrics.map(m => ({
        month: format(new Date(m.month_year + '-01'), 'MMM'),
        month_year: m.month_year,
        fullDate: new Date(m.month_year + '-01'),
        score: m.developer_avg_rating || 0,
        color: '#3B82F6',
        fill: '#3B82F6',
        angle: 0,
        radius: 0
    }));

    // Trend Data
    const trendData = data.monthly_metrics.map(m => ({
        month: format(new Date(m.month_year + '-01'), 'MMM'),
        developer: m.developer_avg_rating || 0,
        manager: m.manager_avg_rating || 0,
        teamAverage: null // No team average for now
    }));

    // Stats
    const stats = [
        {
            label: 'Avg Rating',
            value: data.overall_stats.avg_developer_rating?.toFixed(1) || 'N/A',
            trend: data.overall_stats.avg_developer_rating ? data.trends.developer_rating_trend : undefined,
            trendLabel: data.overall_stats.avg_developer_rating ? 'vs 6m avg' : ''
        },
        {
            label: 'Manager Rating',
            value: data.overall_stats.avg_manager_rating?.toFixed(1) || 'N/A',
            trend: data.overall_stats.avg_manager_rating ? data.trends.manager_rating_trend : undefined,
            trendLabel: data.overall_stats.avg_manager_rating ? 'vs 6m avg' : ''
        },
        {
            label: 'Action Items',
            value: data.overall_stats.total_action_items > 0
                ? `${data.overall_stats.completed_action_items}/${data.overall_stats.total_action_items}`
                : 'N/A',
            trendLabel: data.overall_stats.completion_rate
                ? `${(data.overall_stats.completion_rate * 100).toFixed(0)}% Completion`
                : ''
        },
        {
            label: '1-on-1s',
            value: data.overall_stats.total_one_on_ones || 0,
            trendLabel: 'Completed'
        }
    ];

    return (
        <div className="space-y-6">
            <StatsCards stats={stats} />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <SpiralProgressChart data={spiralData} />
                <MetricsTrendChart data={trendData} />
            </div>

            {/* Tabs / Deep Dive Sections can be added here */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Focus Areas</h3>
                <p className="text-gray-500">
                    Analysis of specific competencies and growth areas will appear here.
                </p>
            </div>
        </div>
    );
}
