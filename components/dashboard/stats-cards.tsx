interface StatCardData {
  label: string;
  value: number | string;
  icon: string;
  iconBg: string;
  trend?: {
    value: string;
    isPositive: boolean;
  };
}

interface StatsCardsProps {
  stats: [StatCardData, StatCardData, StatCardData];
}

export function StatsCards({ stats }: StatsCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {stats.map((stat, index) => (
        <div key={index} className="stat-card">
          <div className="flex items-center gap-3 mb-4">
            <div
              className={`w-10 h-10 rounded-lg ${stat.iconBg} flex items-center justify-center text-xl`}
            >
              {stat.icon}
            </div>
            <span className="text-sm font-semibold text-gray-600">{stat.label}</span>
          </div>

          <div className="flex items-end justify-between">
            <div className="text-3xl font-bold text-gray-900">{stat.value}</div>
            {stat.trend && (
              <span
                className={`text-sm font-semibold flex items-center gap-1 ${
                  stat.trend.isPositive ? 'text-green-600' : 'text-red-600'
                }`}
              >
                <span>{stat.trend.isPositive ? '▴' : '▾'}</span>
                <span>{stat.trend.value}</span>
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
