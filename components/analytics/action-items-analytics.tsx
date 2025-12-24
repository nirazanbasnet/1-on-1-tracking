'use client';

import {
    ComposedChart,
    Line,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from 'recharts';
import { ActionItemsAnalytics as ActionItemsDataType } from '@/lib/types/analytics';

interface ActionItemsAnalyticsProps {
    data: ActionItemsDataType;
}

export function ActionItemsAnalyticsChart({ data }: ActionItemsAnalyticsProps) {
    const chartData = data.monthly_data.map(d => ({
        name: d.month_year,
        created: d.total_items,
        completed: d.completed_items,
        rate: (d.completion_rate || 0) * 100
    }));

    return (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Action Items Velocity</h3>
            <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart
                        data={chartData}
                        margin={{
                            top: 20,
                            right: 20,
                            bottom: 20,
                            left: 20,
                        }}
                    >
                        <CartesianGrid stroke="#f5f5f5" />
                        <XAxis dataKey="name" scale="band" />
                        <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                        <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" unit="%" domain={[0, 100]} />
                        <Tooltip />
                        <Legend />
                        <Bar yAxisId="left" dataKey="created" name="Created" barSize={20} fill="#413ea0" />
                        <Bar yAxisId="left" dataKey="completed" name="Completed" barSize={20} fill="#8884d8" />
                        <Line yAxisId="right" type="monotone" dataKey="rate" name="Completion Rate" stroke="#ff7300" />
                    </ComposedChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
