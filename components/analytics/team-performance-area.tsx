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
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Team Trend</h3>
            <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                        data={data}
                        margin={{
                            top: 10,
                            right: 30,
                            left: 0,
                            bottom: 0,
                        }}
                    >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} />
                        <YAxis axisLine={false} tickLine={false} domain={[0, 5]} />
                        <Tooltip />
                        <Area type="monotone" dataKey="rating" stackId="1" stroke="#8884d8" fill="#8884d8" fillOpacity={0.3} />
                        <Area type="monotone" dataKey="managerRating" stackId="2" stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.3} />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
