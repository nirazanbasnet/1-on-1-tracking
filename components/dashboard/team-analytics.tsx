'use client';

interface TeamMemberMetrics {
  id: string;
  full_name: string | null;
  email: string;
  latestMetric: {
    average_score: number | null;
    metric_data: any;
    month_year: string;
  } | null;
}

interface TeamStatistics {
  currentMonthAverage: number | null;
  averageAlignment: number | null;
  trend: number | null;
  totalSnapshots: number;
  historicalData: Array<{ average_score: number | null; month_year: string }>;
}

interface TeamAnalyticsProps {
  teamMembers: TeamMemberMetrics[];
  statistics: TeamStatistics | null;
}

export function TeamAnalytics({ teamMembers, statistics }: TeamAnalyticsProps) {
  const formatMonthYear = (monthYear: string) => {
    // Use simple string formatting to avoid hydration mismatch
    const [year, month] = monthYear.split('-');
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${monthNames[parseInt(month) - 1]} ${year}`;
  };

  const getScoreColor = (score: number | null) => {
    if (!score) return 'text-gray-400';
    if (score >= 4.5) return 'text-green-600';
    if (score >= 4.0) return 'text-blue-600';
    if (score >= 3.5) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBg = (score: number | null) => {
    if (!score) return 'bg-gray-100';
    if (score >= 4.5) return 'bg-green-100';
    if (score >= 4.0) return 'bg-blue-100';
    if (score >= 3.5) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  if (teamMembers.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Team Analytics</h3>
        <div className="text-center py-8">
          <p className="text-gray-600 font-medium">No team members yet</p>
          <p className="text-sm text-gray-500 mt-1">Add developers to your team to see analytics</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Team Analytics</h3>
        <p className="text-sm text-gray-600 mt-1">Performance overview of your team</p>
      </div>

      <div className="p-6">
        {/* Team Statistics */}
        {statistics && statistics.totalSnapshots > 0 && (
          <div className="grid grid-cols-3 gap-4 mb-6 pb-6 border-b border-gray-200">
            <div className="text-center">
              <p className="text-sm font-medium text-gray-600 mb-1">Team Average</p>
              <p className={`text-3xl font-bold ${getScoreColor(statistics.currentMonthAverage)}`}>
                {statistics.currentMonthAverage?.toFixed(1) || 'N/A'}
              </p>
              {statistics.trend !== null && (
                <p className={`text-xs font-medium mt-1 ${statistics.trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {statistics.trend >= 0 ? '↑' : '↓'} {Math.abs(statistics.trend).toFixed(1)}%
                </p>
              )}
            </div>

            <div className="text-center">
              <p className="text-sm font-medium text-gray-600 mb-1">Avg Alignment</p>
              <p className="text-3xl font-bold text-purple-600">
                {statistics.averageAlignment?.toFixed(2) || 'N/A'}
              </p>
              <p className="text-xs text-gray-500 mt-1">Rating difference</p>
            </div>

            <div className="text-center">
              <p className="text-sm font-medium text-gray-600 mb-1">Completed</p>
              <p className="text-3xl font-bold text-gray-900">{statistics.totalSnapshots}</p>
              <p className="text-xs text-gray-500 mt-1">This month</p>
            </div>
          </div>
        )}

        {/* Team Members List */}
        <div>
          <h4 className="text-sm font-semibold text-gray-900 mb-3">Team Members</h4>
          <div className="space-y-3">
            {teamMembers.map((member) => {
              const score = member.latestMetric?.average_score;
              const metricData = member.latestMetric?.metric_data;

              return (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">
                      {member.full_name || member.email}
                    </p>
                    {member.latestMetric && (
                      <p className="text-xs text-gray-500 mt-0.5">
                        Last updated: {formatMonthYear(member.latestMetric.month_year)}
                      </p>
                    )}
                    {!member.latestMetric && (
                      <p className="text-xs text-gray-400 mt-0.5">No completed 1-on-1s yet</p>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    {score !== null && score !== undefined ? (
                      <>
                        <div className="text-right">
                          <p className="text-xs text-gray-500">Score</p>
                          <p className={`text-lg font-bold ${getScoreColor(score)}`}>
                            {score.toFixed(1)}
                          </p>
                        </div>
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${getScoreBg(score)}`}>
                          <span className={`text-sm font-bold ${getScoreColor(score)}`}>
                            {score.toFixed(1)}
                          </span>
                        </div>
                      </>
                    ) : (
                      <div className="w-12 h-12 rounded-full flex items-center justify-center bg-gray-100">
                        <span className="text-xs font-medium text-gray-400">N/A</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* View Details Link */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <a
            href="/analytics"
            className="text-sm text-blue-600 hover:text-blue-800 font-medium hover:underline"
          >
            View detailed team analytics →
          </a>
        </div>
      </div>
    </div>
  );
}
