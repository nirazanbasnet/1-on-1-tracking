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
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Action Items Velocity</h3>
            <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart
                        data={chartData}
                        margin={{
                            top: 20,
                            right: 20,
                            bottom: 0,
                            left: -20,
                        }}
                    >
                        <CartesianGrid stroke="#E5E7EB" vertical={false} />
                        <XAxis
                            dataKey="name"
                            scale="band"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 12, fill: '#6B7280' }}
                            dy={10}
                        />
                        <YAxis
                            yAxisId="left"
                            orientation="left"
                            stroke="#6B7280"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 12 }}
                        />
                        <YAxis
                            yAxisId="right"
                            orientation="right"
                            stroke="#6B7280"
                            unit="%"
                            domain={[0, 100]}
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 12 }}
                        />
                        <Tooltip
                            contentStyle={{ borderRadius: '6px', border: '1px solid #E5E7EB', boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)', fontSize: '12px' }}
                        />
                        <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} iconSize={8} />
                        <Bar yAxisId="left" dataKey="created" name="Created" barSize={12} fill="#3B82F6" radius={[4, 4, 0, 0]} />
                        <Bar yAxisId="left" dataKey="completed" name="Completed" barSize={12} fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                        <Line yAxisId="right" type="monotone" dataKey="rate" name="Completion Rate" stroke="#F59E0B" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                    </ComposedChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
