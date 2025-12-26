'use client';

import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from 'recharts';
import { MetricTrendData } from '@/lib/types/analytics';

interface MetricsTrendChartProps {
    data: MetricTrendData[];
}

export function MetricsTrendChart({ data }: MetricsTrendChartProps) {
    return (
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Performance Trends</h3>
            <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                        data={data}
                        margin={{
                            top: 5,
                            right: 10,
                            left: -10,
                            bottom: 5,
                        }}
                    >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                        <XAxis
                            dataKey="month"
                            stroke="#6B7280"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            dy={10}
                        />
                        <YAxis
                            stroke="#6B7280"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            domain={[0, 5]}
                        />
                        <Tooltip
                            contentStyle={{ borderRadius: '6px', border: '1px solid #E5E7EB', boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)', fontSize: '12px' }}
                        />
                        <Legend wrapperStyle={{ paddingTop: '10px', fontSize: '12px' }} iconSize={8} />
                        <Line
                            type="monotone"
                            dataKey="developer"
                            name="Developer Self-Rating"
                            stroke="#3B82F6"
                            activeDot={{ r: 4 }}
                            strokeWidth={2}
                            dot={{ r: 2 }}
                        />
                        <Line
                            type="monotone"
                            dataKey="manager"
                            name="Manager Rating"
                            stroke="#10B981"
                            activeDot={{ r: 4 }}
                            strokeWidth={2}
                            dot={{ r: 2 }}
                        />
                        <Line
                            type="monotone"
                            dataKey="teamAverage"
                            name="Team Average"
                            stroke="#9CA3AF"
                            strokeDasharray="4 4"
                            strokeWidth={1.5}
                            dot={false}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
