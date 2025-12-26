'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { AppUser } from '@/lib/types/database';

interface TeamMember extends AppUser {
  oneOnOnes?: Array<{
    id: string;
    month_year: string;
    status: string;
    session_number: number;
    title: string | null;
  }>;
}

interface TeamOneOnOnesProps {
  teamMembers: TeamMember[];
  currentMonth: string;
}

export function TeamOneOnOnes({ teamMembers, currentMonth }: TeamOneOnOnesProps) {
  const router = useRouter();
  const [creatingFor, setCreatingFor] = useState<string | null>(null);
  const [isCreatingAll, setIsCreatingAll] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // All members can have multiple sessions, so we don't filter anyone out
  const membersWithoutOneOnOne = teamMembers;

  const handleCreateOneOnOne = async (developerId: string) => {
    setCreatingFor(developerId);
    setError(null);
    setSuccessMessage(null);

    try {
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

  const handleCreateAll = async () => {
    if (membersWithoutOneOnOne.length === 0) {
      setError('No team members found');
      return;
    }

    if (!confirm(`Create new 1-on-1 sessions for ${membersWithoutOneOnOne.length} team member(s)?`)) {
      return;
    }

    setIsCreatingAll(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch('/api/manager/one-on-ones/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          developer_ids: membersWithoutOneOnOne.map(m => m.id),
          month_year: currentMonth,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create 1-on-1s');
      }

      const { created, failed } = result;

      if (failed > 0) {
        setSuccessMessage(`Created ${created} 1-on-1(s). ${failed} failed.`);
      } else {
        setSuccessMessage(`Successfully created ${created} 1-on-1(s)!`);
      }

      // Refresh to show new data
      router.refresh();
    } catch (err) {
      console.error('Error creating 1-on-1s:', err);
      setError(err instanceof Error ? err.message : 'Failed to create 1-on-1s');
    } finally {
      setIsCreatingAll(false);
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
      <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          Team 1-on-1s - {new Date(currentMonth + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </h3>
        {membersWithoutOneOnOne.length > 0 && (
          <button
            onClick={handleCreateAll}
            disabled={isCreatingAll}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium disabled:opacity-50 flex items-center gap-2"
          >
            {isCreatingAll ? (
              <>
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creating...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create All ({membersWithoutOneOnOne.length})
              </>
            )}
          </button>
        )}
      </div>

      {error && (
        <div className="px-6 py-3 bg-red-50 border-b border-red-100">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {successMessage && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-600">{successMessage}</p>
        </div>
      )}

      {teamMembers.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12">
          <div className="flex flex-col items-center text-center">
            <svg className="w-16 h-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <p className="text-lg font-medium text-gray-900 mb-2">No team members found</p>
            <p className="text-sm text-gray-500">Assign developers to your team to start managing 1-on-1s</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {teamMembers.map((member) => {
            const sessionsThisMonth = (member.oneOnOnes || [])
              .filter((o) => o.month_year === currentMonth)
              .sort((a, b) => b.session_number - a.session_number);
            const isCreating = creatingFor === member.id;

            return (
              <div key={member.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                        <span className="text-lg font-bold text-white">
                          {member.full_name
                            ? member.full_name.charAt(0).toUpperCase()
                            : member.email.charAt(0).toUpperCase()
                          }
                        </span>
                      </div>
                      <div>
                        <h4 className="text-base font-semibold text-gray-900">
                          {member.full_name || member.email.split('@')[0]}
                        </h4>
                        <p className="text-xs text-gray-600">{member.email}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-4">
                  {sessionsThisMonth.length > 0 ? (
                    <>
                      <p className="text-sm text-gray-600 mb-3">
                        {sessionsThisMonth.length} session{sessionsThisMonth.length !== 1 ? 's' : ''} this month
                      </p>
                      <div className="space-y-2 mb-3 max-h-48 overflow-y-auto">
                        {sessionsThisMonth.map((session) => (
                          <a
                            key={session.id}
                            href={`/one-on-one/${session.id}`}
                            className="block p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-medium text-gray-900">
                                  {session.title || `Session ${session.session_number}`}
                                </p>
                                <span
                                  className={`inline-block mt-1 px-2 py-0.5 text-xs font-medium rounded-full capitalize ${getStatusBadge(session.status)}`}
                                >
                                  {session.status}
                                </span>
                              </div>
                              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </div>
                          </a>
                        ))}
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-gray-600 mb-3">No sessions this month</p>
                  )}

                  <div className="space-y-2">
                    <button
                      onClick={() => handleCreateOneOnOne(member.id)}
                      disabled={isCreating || isCreatingAll}
                      className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {isCreating ? (
                        <>
                          <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Creating...
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                          {sessionsThisMonth.length > 0 ? 'Add Another Session' : 'Create Session'}
                        </>
                      )}
                    </button>

                    <a
                      href={`/manager/members/${member.id}`}
                      className="block w-full text-center text-sm text-gray-600 hover:text-gray-900 py-2"
                    >
                      View Full History →
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
