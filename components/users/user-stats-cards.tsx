interface UserStatsCardsProps {
  stats: {
    totalOneOnOnes: number;
    completedOneOnOnes: number;
    pendingOneOnOnes: number;
    totalActionItems: number;
    completedActionItems: number;
    pendingActionItems: number;
    overdueActionItems: number;
    averageScore: number | null;
    completionRate: number;
  };
  userRole: string;
}

export function UserStatsCards({ stats, userRole }: UserStatsCardsProps) {
  const cards = [
    {
      label: '1-on-1 Sessions',
      value: stats.totalOneOnOnes,
      subValue: `${stats.completedOneOnOnes} completed`,
      icon: '📝',
      iconBg: 'bg-blue-50',
      iconColor: 'text-blue-600',
    },
    {
      label: 'Completion Rate',
      value: `${Math.round(stats.completionRate)}%`,
      subValue: `${stats.pendingOneOnOnes} pending`,
      icon: '✓',
      iconBg: 'bg-green-50',
      iconColor: 'text-green-600',
    },
    {
      label: 'Action Items',
      value: stats.totalActionItems,
      subValue: `${stats.completedActionItems} completed`,
      icon: '⏱',
      iconBg: 'bg-purple-50',
      iconColor: 'text-purple-600',
    },
  ];

  // Add average score card for developers
  if (userRole === 'developer' && stats.averageScore !== null) {
    cards.push({
      label: 'Average Score',
      value: stats.averageScore.toFixed(1),
      subValue: 'out of 5.0',
      icon: '⭐',
      iconBg: 'bg-orange-50',
      iconColor: 'text-orange-600',
    });
  }

  // Add overdue items card if there are any
  if (stats.overdueActionItems > 0) {
    cards.push({
      label: 'Overdue Items',
      value: stats.overdueActionItems,
      subValue: 'need attention',
      icon: '🔔',
      iconBg: 'bg-red-50',
      iconColor: 'text-red-600',
    });
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
      {cards.map((card, index) => (
        <div key={index} className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
          <div className="flex items-start gap-4">
            <div className={`w-12 h-12 rounded-full ${card.iconBg} flex items-center justify-center text-2xl flex-shrink-0`}>
              {card.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-600 mb-1">{card.label}</p>
              <p className="text-2xl font-bold text-gray-900 mb-1">{card.value}</p>
              <p className="text-xs text-gray-500">{card.subValue}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
