'use client';

import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface SkillData {
  category: string;
  you: number;
  team: number;
  fullMark: number;
}

interface SkillRadarChartProps {
  data: SkillData[];
  userLabel?: string;
  teamLabel?: string;
}

export function SkillRadarChart({ data, userLabel = 'You', teamLabel = 'Team Average' }: SkillRadarChartProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-gray-900">Skills Overview</h3>
        <div className="flex items-center gap-4 mt-2">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
            <span className="text-xs text-gray-600">{userLabel}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-purple-500"></div>
            <span className="text-xs text-gray-600">{teamLabel}</span>
          </div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={256}>
        <RadarChart data={data} outerRadius={80}>
          <PolarGrid stroke="#e5e7eb" />
          <PolarAngleAxis
            dataKey="category"
            tick={{ fill: '#6b7280', fontSize: 10 }}
            stroke="#9ca3af"
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 5]}
            tick={{ fill: '#9ca3af', fontSize: 10 }}
            stroke="#d1d5db"
            axisLine={false}
          />
          <Radar
            name={userLabel}
            dataKey="you"
            stroke="#3b82f6"
            fill="#3b82f6"
            fillOpacity={0.5}
            strokeWidth={1.5}
          />
          <Radar
            name={teamLabel}
            dataKey="team"
            stroke="#a855f7"
            fill="#a855f7"
            fillOpacity={0.3}
            strokeWidth={1.5}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '0.375rem',
              padding: '0.5rem',
              fontSize: '12px',
              boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)'
            }}
            formatter={(value: any) => typeof value === 'number' ? value.toFixed(1) : value}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
