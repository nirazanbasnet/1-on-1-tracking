'use client';

interface StatCardProps {
    label: string;
    value: string | number;
    trend?: 'up' | 'down' | 'stable';
    trendLabel?: string;
    icon?: React.ReactNode;
}

function StatCard({ label, value, trend, trendLabel, icon }: StatCardProps) {
    return (
        <div className="bg-white overflow-hidden rounded-lg border border-gray-200 p-4 hover:border-blue-300 transition-colors">
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide truncate">{label}</p>
                    <p className="mt-1 text-2xl font-semibold text-gray-900 tracking-tight">{value}</p>
                </div>
                <div className="flex-shrink-0 bg-gray-50 rounded-md p-2">
                    {icon || (
                        <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                    )}
                </div>
            </div>
            {trend && (
                <div className="mt-2 flex items-center text-xs">
                    <span className={`font-medium ${trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-gray-600'} flex items-center`}>
                        {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'}
                        <span className="ml-1">{trendLabel || 'vs last period'}</span>
                    </span>
                </div>
            )}
        </div>
    );
}

interface StatsCardsProps {
    stats: {
        label: string;
        value: string | number;
        trend?: 'up' | 'down' | 'stable';
        trendLabel?: string;
        icon?: React.ReactNode;
    }[];
}

export function StatsCards({ stats }: StatsCardsProps) {
    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat, i) => (
                <StatCard key={i} {...stat} />
            ))}
        </div>
    );
}
