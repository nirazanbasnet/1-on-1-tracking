/**
 * Loading skeleton components for better UX
 */

export function DashboardSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-gray-200 rounded-lg h-96" />
        <div className="bg-gray-200 rounded-lg h-96" />
      </div>
      <div className="bg-gray-200 rounded-lg h-64" />
    </div>
  );
}

export function OneOnOneFormSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="bg-gray-200 rounded-lg h-32" />
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-gray-200 rounded-lg h-48" />
      ))}
      <div className="bg-gray-200 rounded-lg h-64" />
    </div>
  );
}

export function MetricsSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="grid grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-gray-200 rounded-lg h-24" />
        ))}
      </div>
      <div className="bg-gray-200 rounded-lg h-48" />
    </div>
  );
}

export function NotificationSkeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-start gap-3 p-4">
          <div className="w-10 h-10 bg-gray-200 rounded-full" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 rounded w-3/4" />
            <div className="h-3 bg-gray-200 rounded w-full" />
          </div>
        </div>
      ))}
    </div>
  );
}
