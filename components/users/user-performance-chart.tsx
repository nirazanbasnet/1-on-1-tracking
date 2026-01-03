'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface UserPerformanceChartProps {
  metrics: Array<{
    month_year: string;
    average_score: number;
    metric_data: any;
  }>;
}

export function UserPerformanceChart({ metrics }: UserPerformanceChartProps) {
  const chartData = metrics
    .slice(0, 6)
    .reverse()
    .map((metric) => ({
      month: new Date(metric.month_year + '-01').toLocaleDateString('en-US', {
        month: 'short',
        year: '2-digit',
      }),
      'Your Rating': metric.metric_data?.developer_avg_rating || 0,
      'Manager Rating': metric.metric_data?.manager_avg_rating || 0,
    }));

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-1">Performance Trend</h3>
        <p className="text-sm text-gray-600">Your ratings over the last 6 months</p>
      </div>

      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="month"
            stroke="#9CA3AF"
            style={{ fontSize: '12px' }}
          />
          <YAxis
            domain={[0, 5]}
            ticks={[0, 1, 2, 3, 4, 5]}
            stroke="#9CA3AF"
            style={{ fontSize: '12px' }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            }}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="Your Rating"
            stroke="#FF9B7B"
            strokeWidth={3}
            dot={{ fill: '#FF9B7B', r: 4 }}
            activeDot={{ r: 6 }}
          />
          <Line
            type="monotone"
            dataKey="Manager Rating"
            stroke="#6B9FD1"
            strokeWidth={3}
            dot={{ fill: '#6B9FD1', r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
