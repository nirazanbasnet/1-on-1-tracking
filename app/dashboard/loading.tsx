import { DashboardLoadingSkeleton } from '@/components/ui/loading-spinner';

export default function DashboardLoading() {
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
          <DashboardLoadingSkeleton />
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
