import Link from 'next/link';

interface UserRecentSessionsProps {
  sessions: Array<{
    id: string;
    month_year: string;
    status: string;
    developer_id: string;
    manager_id: string;
  }>;
  userRole: string;
  userId: string;
}

export function UserRecentSessions({ sessions, userRole, userId }: UserRecentSessionsProps) {
  const getStatusBadge = (status: string) => {
    const badges = {
      draft: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Draft' },
      submitted: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Submitted' },
      reviewed: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Reviewed' },
      completed: { bg: 'bg-green-100', text: 'text-green-800', label: 'Completed' },
    };
    return badges[status as keyof typeof badges] || badges.draft;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">Recent 1-on-1s</h3>
          <p className="text-sm text-gray-600">Last 5 sessions</p>
        </div>
        <Link
          href="/dashboard#sessions"
          className="text-sm text-blue-600 hover:text-blue-800 font-medium"
        >
          View All →
        </Link>
      </div>

      {sessions.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-sm text-gray-500">No 1-on-1 sessions yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map((session) => {
            const badge = getStatusBadge(session.status);
            const isDeveloper = session.developer_id === userId;

            return (
              <Link
                key={session.id}
                href={`/one-on-one/${session.id}`}
                className="block p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900 mb-1">
                      {new Date(session.month_year + '-01').toLocaleDateString('en-US', {
                        month: 'long',
                        year: 'numeric',
                      })}
                    </p>
                    <p className="text-xs text-gray-600">
                      {isDeveloper ? 'As Developer' : 'As Manager'}
                    </p>
                  </div>
                  <span className={`px-3 py-1 text-xs font-medium rounded-full ${badge.bg} ${badge.text}`}>
                    {badge.label}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
