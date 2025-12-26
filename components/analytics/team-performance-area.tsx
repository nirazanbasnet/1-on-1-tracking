'use client';

import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from 'recharts';
import { MonthlyMetrics } from '@/lib/types/analytics';

interface TeamPerformanceAreaProps {
    metrics: MonthlyMetrics[];
}

export function TeamPerformanceArea({ metrics }: TeamPerformanceAreaProps) {
    // We want to show the 'team average' trend.
    // Assuming metrics passed here are aggregated team metrics.

    const data = metrics.map(m => ({
        name: m.month_year,
        rating: m.developer_avg_rating || 0, // Using dev rating as proxy for morale/performance
        managerRating: m.manager_avg_rating || 0
    }));

    return (
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Team Trend</h3>
            <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                        data={data}
                        margin={{
                            top: 10,
                            right: 10,
                            left: -20,
                            bottom: 0,
                        }}
                    >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                        <XAxis
                            dataKey="name"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 12, fill: '#6B7280' }}
                            dy={10}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            domain={[0, 5]}
                            tick={{ fontSize: 12, fill: '#6B7280' }}
                        />
                        <Tooltip
                            contentStyle={{ borderRadius: '6px', border: '1px solid #E5E7EB', boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)' }}
                            itemStyle={{ fontSize: '12px' }}
                        />
                        <Area type="monotone" dataKey="rating" stackId="1" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.1} strokeWidth={2} />
                        <Area type="monotone" dataKey="managerRating" stackId="2" stroke="#10B981" fill="#10B981" fillOpacity={0.1} strokeWidth={2} />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
