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
import { TeamComparison } from '@/lib/types/analytics';

interface TeamComparisonChartProps {
    teams: TeamComparison[];
}

export function TeamComparisonChart({ teams }: TeamComparisonChartProps) {
    const data = teams.map(t => ({
        name: t.team_name,
        rating: t.avg_developer_rating || 0,
        managerRating: t.avg_manager_rating || 0,
    }));

    return (
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Team Comparisons</h3>
            <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={data}
                        layout="vertical"
                        margin={{
                            top: 5,
                            right: 10,
                            left: 10,
                            bottom: 0,
                        }}
                        barGap={1}
                        barCategoryGap={16}
                    >
                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#E5E7EB" />
                        <XAxis type="number" domain={[0, 5]} hide={false} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#6B7280' }} />
                        <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 11, fill: '#374151' }} axisLine={false} tickLine={false} />
                        <Tooltip
                            cursor={{ fill: '#F9FAFB' }}
                            contentStyle={{ borderRadius: '6px', border: '1px solid #E5E7EB', boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)', fontSize: '12px' }}
                        />
                        <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '5px' }} iconSize={8} />
                        <Bar dataKey="rating" name="Dev Rating" fill="#3B82F6" radius={[0, 3, 3, 0]} barSize={12} />
                        <Bar dataKey="managerRating" name="Mgr Rating" fill="#10B981" radius={[0, 3, 3, 0]} barSize={12} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
