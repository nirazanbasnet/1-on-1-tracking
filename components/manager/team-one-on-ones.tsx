'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { AppUser } from '@/lib/types/database';

interface TeamMember extends AppUser {
  oneOnOnes?: Array<{
    id: string;
    month_year: string;
    status: string;
  }>;
}

interface TeamOneOnOnesProps {
  teamMembers: TeamMember[];
  currentMonth: string;
}

export function TeamOneOnOnes({ teamMembers, currentMonth }: TeamOneOnOnesProps) {
  const router = useRouter();
  const [creatingFor, setCreatingFor] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleCreateOneOnOne = async (developerId: string) => {
    setCreatingFor(developerId);
    setError(null);
    setSuccessMessage(null);

    try {
      console.log('Creating 1-on-1 for developer:', { developerId, currentMonth });

      const response = await fetch('/api/manager/one-on-ones', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          developer_id: developerId,
          month_year: currentMonth,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create 1-on-1');
      }

      console.log('1-on-1 created successfully:', result);

      setSuccessMessage('1-on-1 created successfully!');

      // Refresh to show new data
      router.refresh();
    } catch (err) {
      console.error('Error creating 1-on-1:', err);
      setError(err instanceof Error ? err.message : 'Failed to create 1-on-1');
    } finally {
      setCreatingFor(null);
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

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">
          Team 1-on-1s - {new Date(currentMonth + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </h3>
      </div>

      {error && (
        <div className="px-6 py-3 bg-red-50 border-b border-red-100">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {successMessage && (
        <div className="px-6 py-3 bg-green-50 border-b border-green-100">
          <p className="text-sm text-green-600">{successMessage}</p>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Developer
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {teamMembers.map((member) => {
              const currentMonthOneOnOne = member.oneOnOnes?.find(
                (o) => o.month_year === currentMonth
              );
              const isCreating = creatingFor === member.id;

              return (
                <tr key={member.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {member.full_name || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {member.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {currentMonthOneOnOne ? (
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(currentMonthOneOnOne.status)}`}
                      >
                        {currentMonthOneOnOne.status}
                      </span>
                    ) : (
                      <span className="text-sm text-gray-400">Not started</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {currentMonthOneOnOne ? (
                      <a
                        href={`/one-on-one/${currentMonthOneOnOne.id}`}
                        className="text-blue-600 hover:text-blue-800 font-medium"
                      >
                        View
                      </a>
                    ) : (
                      <button
                        onClick={() => handleCreateOneOnOne(member.id)}
                        disabled={isCreating}
                        className="text-blue-600 hover:text-blue-800 font-medium disabled:opacity-50"
                      >
                        {isCreating ? 'Creating...' : 'Create 1-on-1'}
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
            {teamMembers.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-sm text-gray-500">
                  No team members found. Assign developers to your team to start managing 1-on-1s.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
