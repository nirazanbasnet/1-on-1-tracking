export default function OneOnOneLoading() {
  return (
    <div className="min-h-screen bg-warmGray-100">
      <div className="dashboard-container">
        {/* Left Sidebar Skeleton */}
        <aside className="sidebar-left hidden lg:block sticky top-0 h-screen overflow-y-auto bg-white border-r border-warmGray-200">
          <div className="p-6 space-y-6 animate-pulse">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gray-200 rounded-lg"></div>
              <div className="h-6 bg-gray-200 rounded w-32"></div>
            </div>
            <div className="space-y-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-10 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="main-content overflow-y-auto p-8">
          <div className="space-y-6 animate-pulse">
            {/* Back Navigation Skeleton */}
            <div className="h-6 bg-gray-200 rounded w-32"></div>

            {/* Session Header Skeleton */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex justify-between">
                <div className="flex-1">
                  <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                </div>
                <div className="h-8 bg-gray-200 rounded w-24"></div>
              </div>
            </div>

            {/* Form Header Skeleton */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="h-8 bg-gray-200 rounded w-1/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </div>

            {/* Category Tabs Skeleton */}
            <div className="bg-white rounded-lg shadow">
              <div className="border-b border-gray-200 p-4">
                <div className="flex gap-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="h-10 bg-gray-200 rounded w-24"></div>
                  ))}
                </div>
              </div>
              <div className="p-6 space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-gray-50 rounded-lg p-4">
                    <div className="h-6 bg-gray-200 rounded w-3/4 mb-3"></div>
                    <div className="h-20 bg-gray-200 rounded"></div>
                  </div>
                ))}
              </div>
            </div>

            {/* Notes Section Skeleton */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
            </div>

            {/* Action Items Skeleton */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-20 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>

            {/* Action Buttons Skeleton */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between">
                <div className="h-10 bg-gray-200 rounded w-32"></div>
                <div className="h-10 bg-gray-200 rounded w-40"></div>
              </div>
            </div>
          </div>
        </main>

        {/* Right Sidebar Skeleton */}
        <aside className="sidebar-right hidden lg:block sticky top-0 h-screen overflow-y-auto bg-white border-l border-warmGray-200">
          <div className="p-6 space-y-6 animate-pulse">
            <div className="bg-gray-200 rounded-lg h-32"></div>
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-16 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
