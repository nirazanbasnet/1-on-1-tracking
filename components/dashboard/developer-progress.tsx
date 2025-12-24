'use client';

import type { MetricsSnapshot } from '@/lib/types/database';

interface DeveloperProgressProps {
  metrics: MetricsSnapshot[];
  developerName: string;
}

export function DeveloperProgress({ metrics, developerName }: DeveloperProgressProps) {
  if (metrics.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Progress</h3>
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <p className="text-gray-600 font-medium">No metrics yet</p>
          <p className="text-sm text-gray-500 mt-1">Complete a 1-on-1 to see your progress</p>
        </div>
      </div>
    );
  }

  const latestMetric = metrics[0];
  const previousMetric = metrics[1];

  // Calculate trend
  const trend = latestMetric.average_score && previousMetric?.average_score
    ? ((latestMetric.average_score - previousMetric.average_score) / previousMetric.average_score) * 100
    : null;

  const formatMonthYear = (monthYear: string) => {
    // Use simple string formatting to avoid hydration mismatch
    const [year, month] = monthYear.split('-');
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${monthNames[parseInt(month) - 1]} ${year}`;
  };

  const getAlignmentLevel = (alignment: number | null) => {
    if (!alignment) return { label: 'N/A', color: 'text-gray-600', bg: 'bg-gray-100' };
    if (alignment < 0.5) return { label: 'Excellent', color: 'text-green-600', bg: 'bg-green-100' };
    if (alignment < 1.0) return { label: 'Good', color: 'text-blue-600', bg: 'bg-blue-100' };
    if (alignment < 1.5) return { label: 'Fair', color: 'text-yellow-600', bg: 'bg-yellow-100' };
    return { label: 'Needs Attention', color: 'text-red-600', bg: 'bg-red-100' };
  };

  const metricData = latestMetric.metric_data as any;
  const alignment = getAlignmentLevel(metricData?.rating_alignment);

  // Prepare chart data (last 6 months)
  const chartMetrics = metrics.slice(0, 6).reverse();
  const maxScore = 5;
  const chartHeight = 120;

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Your Progress</h3>
        <p className="text-sm text-gray-600 mt-1">Performance trends over time</p>
      </div>

      <div className="p-6">
        {/* Current Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center">
            <p className="text-sm font-medium text-gray-600 mb-1">Latest Score</p>
            <p className="text-3xl font-bold text-gray-900">
              {latestMetric.average_score?.toFixed(1) || 'N/A'}
            </p>
            {trend !== null && (
              <p className={`text-xs font-medium mt-1 ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {trend >= 0 ? '↑' : '↓'} {Math.abs(trend).toFixed(1)}% from last month
              </p>
            )}
          </div>

          <div className="text-center">
            <p className="text-sm font-medium text-gray-600 mb-1">Self Rating</p>
            <p className="text-3xl font-bold text-blue-600">
              {metricData?.developer_avg_rating?.toFixed(1) || 'N/A'}
            </p>
            <p className="text-xs text-gray-500 mt-1">Your assessment</p>
          </div>

          <div className="text-center">
            <p className="text-sm font-medium text-gray-600 mb-1">Manager Rating</p>
            <p className="text-3xl font-bold text-purple-600">
              {metricData?.manager_avg_rating?.toFixed(1) || 'N/A'}
            </p>
            <p className="text-xs text-gray-500 mt-1">Manager's view</p>
          </div>
        </div>

        {/* Alignment Badge */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Rating Alignment</span>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${alignment.bg} ${alignment.color}`}>
              {alignment.label}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {metricData?.rating_alignment !== null
              ? `Difference of ${metricData?.rating_alignment?.toFixed(2)} between self and manager ratings`
              : 'Complete a rating-based 1-on-1 to see alignment'}
          </p>
        </div>

        {/* Mini Trend Chart */}
        {chartMetrics.length > 1 && (
          <div>
            <p className="text-sm font-medium text-gray-700 mb-3">6-Month Trend</p>
            <div className="relative" style={{ height: chartHeight }}>
              {/* Y-axis labels */}
              <div className="absolute left-0 top-0 bottom-0 w-8 flex flex-col justify-between text-xs text-gray-500">
                <span>{maxScore}</span>
                <span>{(maxScore / 2).toFixed(1)}</span>
                <span>0</span>
              </div>

              {/* Chart area */}
              <div className="ml-10 h-full border-l border-b border-gray-200 relative">
                {/* Grid lines */}
                <div className="absolute inset-0 flex flex-col justify-between">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="border-t border-gray-100" />
                  ))}
                </div>

                {/* Line chart */}
                <svg className="absolute inset-0 w-full h-full" style={{ overflow: 'visible' }}>
                  {/* Line */}
                  <polyline
                    fill="none"
                    stroke="#3B82F6"
                    strokeWidth="2"
                    points={chartMetrics
                      .map((metric, index) => {
                        const x = (index / (chartMetrics.length - 1)) * 100;
                        const y = metric.average_score
                          ? ((maxScore - metric.average_score) / maxScore) * 100
                          : 0;
                        return `${x}%,${y}%`;
                      })
                      .join(' ')}
                  />

                  {/* Points */}
                  {chartMetrics.map((metric, index) => {
                    const x = (index / (chartMetrics.length - 1)) * 100;
                    const y = metric.average_score
                      ? ((maxScore - metric.average_score) / maxScore) * 100
                      : 0;
                    return (
                      <g key={index}>
                        <circle
                          cx={`${x}%`}
                          cy={`${y}%`}
                          r="4"
                          fill="#3B82F6"
                          stroke="white"
                          strokeWidth="2"
                        />
                      </g>
                    );
                  })}
                </svg>

                {/* X-axis labels */}
                <div className="absolute -bottom-6 left-0 right-0 flex justify-between text-xs text-gray-500">
                  {chartMetrics.map((metric, index) => (
                    <span key={index} className="text-center" style={{ width: `${100 / chartMetrics.length}%` }}>
                      {formatMonthYear(metric.month_year)}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* View Details Link */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <a
            href="/analytics"
            className="text-sm text-blue-600 hover:text-blue-800 font-medium hover:underline"
          >
            View detailed analytics →
          </a>
        </div>
      </div>
    </div>
  );
}
