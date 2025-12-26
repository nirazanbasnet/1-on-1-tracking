'use client';

import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from 'recharts';
import { TeamMemberSummary } from '@/lib/types/analytics';

interface ComparativeChartProps {
    members: TeamMemberSummary[];
}

export function ComparativeChart({ members }: ComparativeChartProps) {
    // Filter out members with incomplete data if needed, or handle nulls
    const data = members.map(m => ({
        name: m.developer_name.split(' ')[0], // First name for brevity
        rating: m.latest_developer_rating || 0,
        managerRating: m.latest_manager_rating || 0,
        completion: (m.action_items_completion_rate || 0) * 5 // Scale to 5 for comparison
    }));

    return (
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Member Comparison</h3>
            <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={data}
                        barGap={2}
                        margin={{
                            top: 20,
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
                            domain={[0, 5]}
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 12, fill: '#6B7280' }}
                        />
                        <Tooltip
                            cursor={{ fill: '#F3F4F6' }}
                            contentStyle={{ borderRadius: '6px', border: '1px solid #E5E7EB', boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)', fontSize: '12px' }}
                        />
                        <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} iconSize={8} />
                        <Bar dataKey="rating" name="Dev Rating" fill="#3B82F6" radius={[4, 4, 0, 0]} maxBarSize={40} />
                        <Bar dataKey="managerRating" name="Mgr Rating" fill="#10B981" radius={[4, 4, 0, 0]} maxBarSize={40} />
                        {/* Optional: Completion encoded differently or separate chart */}
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
