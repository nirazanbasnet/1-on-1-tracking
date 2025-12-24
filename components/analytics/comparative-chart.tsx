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
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Member Comparison</h3>
            <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={data}
                        margin={{
                            top: 20,
                            right: 30,
                            left: 20,
                            bottom: 5,
                        }}
                    >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" />
                        <YAxis domain={[0, 5]} />
                        <Tooltip
                            cursor={{ fill: 'transparent' }}
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        />
                        <Legend />
                        <Bar dataKey="rating" name="Dev Rating" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="managerRating" name="Mgr Rating" fill="#10B981" radius={[4, 4, 0, 0]} />
                        {/* Optional: Completion encoded differently or separate chart */}
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
