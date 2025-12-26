'use client';

import {
    RadialBarChart,
    RadialBar,
    Legend,
    Tooltip,
    ResponsiveContainer,
    PolarAngleAxis,
} from 'recharts';
import { SpiralChartData } from '@/lib/types/analytics';

interface SpiralProgressChartProps {
    data: SpiralChartData[];
}

const style = {
    top: '50%',
    right: 0,
    transform: 'translate(0, -50%)',
    lineHeight: '24px',
};

export function SpiralProgressChart({ data }: SpiralProgressChartProps) {
    // Sort data so the latest month is the outermost or innermost?
    // Usually outermost is latest for visibility.
    // Recharts RadialBar plots based on order in data array.
    // First item = Innermost? Let's verify. 
    // We want latest month to be most prominent.
    // We'll prepare data with fill colors based on score.

    const processedData = data.map((item) => ({
        ...item,
        fill: item.score >= 4.5 ? '#10B981' : // Excellent (Green)
            item.score >= 4.0 ? '#3B82F6' : // Good (Blue)
                item.score >= 3.5 ? '#F59E0B' : // Fair (Yellow)
                    '#EF4444', // Needs Attention (Red)
        name: item.month,
        // RadialBarChart expects a value to determine the angle
        // If we want 5.0 to be 360 degrees (or close to it)
        value: item.score,
        max: 5,
    }));

    return (
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 h-full">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Growth Spiral</h3>
            <div className="h-64 w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                    <RadialBarChart
                        cx="50%"
                        cy="50%"
                        innerRadius="20%"
                        outerRadius="100%"
                        barSize={15}
                        data={processedData}
                        startAngle={90}
                        endAngle={-270}
                    >
                        <PolarAngleAxis
                            type="number"
                            domain={[0, 5]}
                            angleAxisId={0}
                            tick={false}
                        />
                        <RadialBar
                            label={{ position: 'insideStart', fill: '#fff', fontSize: '10px' }}
                            background
                            dataKey="value"
                            cornerRadius={10}
                        />
                        <Legend
                            iconSize={8}
                            layout="vertical"
                            verticalAlign="middle"
                            wrapperStyle={{
                                top: '50%',
                                right: 0,
                                transform: 'translate(0, -50%)',
                                lineHeight: '20px',
                                fontSize: '12px',
                                color: '#6B7280'
                            }}
                        />
                        <Tooltip
                            cursor={{ stroke: 'red', strokeWidth: 2 }}
                            content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                    const d = payload[0].payload;
                                    return (
                                        <div className="bg-white p-2 border border-gray-200 shadow-lg rounded">
                                            <p className="font-semibold text-xs">{d.month}</p>
                                            <p className="text-xs">Rating: <span style={{ color: d.fill }}>{d.score.toFixed(1)}</span></p>
                                        </div>
                                    );
                                }
                                return null;
                            }}
                        />
                    </RadialBarChart>
                </ResponsiveContainer>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                    <p className="text-[10px] text-gray-500 uppercase tracking-wide">Avg</p>
                    <p className="text-xl font-bold text-gray-900">
                        {(data.reduce((acc, curr) => acc + curr.score, 0) / (data.length || 1)).toFixed(1)}
                    </p>
                </div>
            </div>
        </div>
    );
}
