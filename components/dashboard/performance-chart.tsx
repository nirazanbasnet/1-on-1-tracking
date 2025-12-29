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

interface ChartDataPoint {
  month: string;
  line1: number;
  line2: number;
}

interface PerformanceChartProps {
  title: string;
  data: ChartDataPoint[];
  line1Label: string;
  line2Label: string;
  line1Color?: string;
  line2Color?: string;
}

export function PerformanceChart({
  title,
  data,
  line1Label,
  line2Label,
  line1Color = '#FF9B7B',
  line2Color = '#6B9FD1',
}: PerformanceChartProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">{title}</h2>
        <select className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 bg-white hover:border-gray-300 transition-colors">
          <option>Last 6 Months</option>
          <option>Last 3 Months</option>
          <option>Last Year</option>
        </select>
      </div>

      <ResponsiveContainer width="100%" height={280}>
        <LineChart
          data={data}
          margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
          <XAxis
            dataKey="month"
            stroke="#999"
            fontSize={13}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke="#999"
            fontSize={13}
            tickLine={false}
            axisLine={false}
            domain={[0, 5]}
            ticks={[0, 1, 2, 3, 4, 5]}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1a1a1a',
              border: 'none',
              borderRadius: '8px',
              color: '#fff',
              fontSize: '13px',
              padding: '12px 16px',
            }}
            itemStyle={{ color: '#fff' }}
            labelStyle={{ fontWeight: 'bold', marginBottom: '4px' }}
          />
          <Legend
            iconType="circle"
            wrapperStyle={{ fontSize: '14px', paddingTop: '20px' }}
          />
          <Line
            type="monotone"
            dataKey="line1"
            name={line1Label}
            stroke={line1Color}
            strokeWidth={3}
            dot={{ fill: line1Color, strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6 }}
          />
          <Line
            type="monotone"
            dataKey="line2"
            name={line2Label}
            stroke={line2Color}
            strokeWidth={3}
            dot={{ fill: line2Color, strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
