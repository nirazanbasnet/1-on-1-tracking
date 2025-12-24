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
        <div className="bg-white overflow-hidden rounded-lg shadow border border-gray-100 p-5">
            <div className="flex items-center">
                <div className="flex-shrink-0 bg-blue-50 rounded-md p-3">
                    {icon || (
                        <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                    )}
                </div>
                <div className="ml-5 w-0 flex-1">
                    <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">{label}</dt>
                        <dd>
                            <div className="text-lg font-bold text-gray-900">{value}</div>
                        </dd>
                    </dl>
                </div>
            </div>
            {trend && (
                <div className="mt-4">
                    <div className={`text-sm ${trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-gray-600'
                        } flex items-center font-medium`}>
                        {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'}
                        <span className="ml-1">{trendLabel || 'vs last period'}</span>
                    </div>
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
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat, i) => (
                <StatCard key={i} {...stat} />
            ))}
        </div>
    );
}
