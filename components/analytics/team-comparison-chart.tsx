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
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Team Comparisons</h3>
            <div className="h-96 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={data}
                        layout="vertical"
                        margin={{
                            top: 20,
                            right: 30,
                            left: 40,
                            bottom: 5,
                        }}
                    >
                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                        <XAxis type="number" domain={[0, 5]} />
                        <YAxis type="category" dataKey="name" width={100} />
                        <Tooltip
                            cursor={{ fill: '#f3f4f6' }}
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        />
                        <Legend />
                        <Bar dataKey="rating" name="Dev Rating" fill="#3B82F6" radius={[0, 4, 4, 0]} barSize={20} />
                        <Bar dataKey="managerRating" name="Mgr Rating" fill="#10B981" radius={[0, 4, 4, 0]} barSize={20} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
