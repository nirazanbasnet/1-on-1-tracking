'use client';

interface ManagerInfoProps {
  manager: {
    id: string;
    email: string;
    full_name: string | null;
  } | null;
  teamName: string | null;
}

export function ManagerInfo({ manager, teamName }: ManagerInfoProps) {
  if (!manager) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center">
              <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
          </div>
          <div className="ml-4">
            <h3 className="text-sm font-medium text-gray-900">No Manager Assigned</h3>
            <p className="text-sm text-gray-500">Contact an admin to assign you to a team</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Your Manager</h3>
      </div>
      <div className="p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <span className="text-2xl font-bold text-white">
                {manager.full_name
                  ? manager.full_name.charAt(0).toUpperCase()
                  : manager.email.charAt(0).toUpperCase()
                }
              </span>
            </div>
          </div>
          <div className="ml-5 flex-1">
            <h4 className="text-lg font-semibold text-gray-900">
              {manager.full_name || manager.email}
            </h4>
            <p className="text-sm text-gray-600">{manager.email}</p>
            {teamName && (
              <div className="mt-2 inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                </svg>
                {teamName}
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Need to schedule a 1-on-1?</span>
            <a
              href={`mailto:${manager.email}?subject=1-on-1 Request`}
              className="text-blue-600 hover:text-blue-800 font-medium hover:underline"
            >
              Email Manager →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
