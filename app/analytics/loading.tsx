export default function AnalyticsLoading() {
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
            {/* Header Skeleton */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="h-8 bg-gray-200 rounded w-1/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/3"></div>
            </div>

            {/* Filters Skeleton */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex gap-4">
                <div className="h-10 bg-gray-200 rounded w-32"></div>
                <div className="h-10 bg-gray-200 rounded w-32"></div>
                <div className="h-10 bg-gray-200 rounded w-32"></div>
              </div>
            </div>

            {/* Charts Grid Skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-white rounded-xl shadow-sm p-6">
                  <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
                  <div className="h-64 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>

            {/* Table Skeleton */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
              <div className="space-y-3">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="h-12 bg-gray-200 rounded"></div>
                ))}
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
