'use client';

import { getOrCreateCurrentMonthOneOnOne } from '@/app/actions/one-on-ones';
import { useState } from 'react';

interface OneOnOneWithRelations {
  id: string;
  month_year: string;
  status: string;
  developer_submitted_at: string | null;
  manager_reviewed_at: string | null;
  completed_at: string | null;
  manager: {
    id: string;
    email: string;
    full_name: string | null;
  };
}

interface MyOneOnOnesProps {
  oneOnOnes: OneOnOneWithRelations[];
  developerId: string;
  currentMonth: string;
}

export function MyOneOnOnes({ oneOnOnes, developerId, currentMonth }: MyOneOnOnesProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentMonthOneOnOne = oneOnOnes.find((o) => o.month_year === currentMonth);

  const handleStartCurrentMonth = async () => {
    setIsCreating(true);
    setError(null);

    try {
      const oneOnOne = await getOrCreateCurrentMonthOneOnOne(developerId);
      window.location.href = `/one-on-one/${oneOnOne.id}`;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create 1-on-1');
    } finally {
      setIsCreating(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      draft: 'bg-gray-100 text-gray-800',
      submitted: 'bg-blue-100 text-blue-800',
      reviewed: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-green-100 text-green-800',
    };
    return badges[status as keyof typeof badges] || badges.draft;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      {/* Current Month Card */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">
              {new Date(currentMonth + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} 1-on-1
            </h3>
            <p className="text-sm text-gray-600 mt-1">Your monthly check-in</p>
          </div>
          {currentMonthOneOnOne ? (
            <span
              className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusBadge(currentMonthOneOnOne.status)}`}
            >
              {currentMonthOneOnOne.status}
            </span>
          ) : null}
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {currentMonthOneOnOne ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Manager:</span>
              <span className="font-medium text-gray-900">
                {currentMonthOneOnOne.manager.full_name || currentMonthOneOnOne.manager.email}
              </span>
            </div>
            {currentMonthOneOnOne.developer_submitted_at && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Submitted:</span>
                <span className="text-gray-900">{formatDate(currentMonthOneOnOne.developer_submitted_at)}</span>
              </div>
            )}
            {currentMonthOneOnOne.manager_reviewed_at && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Reviewed:</span>
                <span className="text-gray-900">{formatDate(currentMonthOneOnOne.manager_reviewed_at)}</span>
              </div>
            )}
            <div className="pt-3 border-t">
              <a
                href={`/one-on-one/${currentMonthOneOnOne.id}`}
                className="block w-full text-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                {currentMonthOneOnOne.status === 'draft' ? 'Continue' : 'View'} 1-on-1
              </a>
            </div>
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-gray-600 mb-4">You haven't started your 1-on-1 for this month yet.</p>
            <button
              onClick={handleStartCurrentMonth}
              disabled={isCreating}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
            >
              {isCreating ? 'Starting...' : 'Start 1-on-1'}
            </button>
          </div>
        )}
      </div>

      {/* Previous 1-on-1s */}
      {oneOnOnes.length > 0 && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Previous 1-on-1s</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Month
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Manager
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Completed
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {oneOnOnes.map((oneOnOne) => (
                  <tr key={oneOnOne.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {new Date(oneOnOne.month_year + '-01').toLocaleDateString('en-US', {
                        month: 'long',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {oneOnOne.manager.full_name || oneOnOne.manager.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(oneOnOne.status)}`}
                      >
                        {oneOnOne.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {formatDate(oneOnOne.completed_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <a
                        href={`/one-on-one/${oneOnOne.id}`}
                        className="text-blue-600 hover:text-blue-800 font-medium"
                      >
                        View
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
