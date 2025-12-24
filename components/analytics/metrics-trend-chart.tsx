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
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Trends</h3>
            <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                        data={data}
                        margin={{
                            top: 5,
                            right: 30,
                            left: 20,
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
                        />
                        <YAxis
                            stroke="#6B7280"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            domain={[0, 5]}
                        />
                        <Tooltip
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        />
                        <Legend wrapperStyle={{ paddingTop: '20px' }} />
                        <Line
                            type="monotone"
                            dataKey="developer"
                            name="Developer Self-Rating"
                            stroke="#3B82F6"
                            activeDot={{ r: 6 }}
                            strokeWidth={2}
                        />
                        <Line
                            type="monotone"
                            dataKey="manager"
                            name="Manager Rating"
                            stroke="#10B981"
                            activeDot={{ r: 6 }}
                            strokeWidth={2}
                        />
                        <Line
                            type="monotone"
                            dataKey="teamAverage"
                            name="Team Average"
                            stroke="#9CA3AF"
                            strokeDasharray="5 5"
                            strokeWidth={2}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
