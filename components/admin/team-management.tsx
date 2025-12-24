'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { Team, AppUser } from '@/lib/types/database';

interface TeamWithManager extends Team {
  manager?: Pick<AppUser, 'email' | 'full_name'> | null;
}

interface AppUserWithTeams extends AppUser {
  team_ids?: string[];
}

interface TeamManagementProps {
  teams: TeamWithManager[];
  managers: AppUser[];
  allUsers?: AppUserWithTeams[];
}

export function TeamManagement({ teams: initialTeams, managers, allUsers = [] }: TeamManagementProps) {
  const router = useRouter();
  const [teams, setTeams] = useState(initialTeams);

  // Sync teams state when props change (after router.refresh())
  useEffect(() => {
    setTeams(initialTeams);
  }, [initialTeams]);
  const [isCreating, setIsCreating] = useState(false);
  const [editingTeamId, setEditingTeamId] = useState<string | null>(null);
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamManager, setNewTeamManager] = useState('');
  const [editTeamName, setEditTeamName] = useState('');
  const [editTeamManager, setEditTeamManager] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleCreateTeam = async () => {
    if (!newTeamName.trim()) {
      setError('Team name is required');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const requestBody: { name: string; manager_id?: string } = {
        name: newTeamName.trim()
      };

      if (newTeamManager) {
        requestBody.manager_id = newTeamManager;
      }

      console.log('Creating team:', requestBody);

      const response = await fetch('/api/admin/teams', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create team');
      }

      console.log('Team created:', result);

      // Reset form
      setNewTeamName('');
      setNewTeamManager('');
      setIsCreating(false);
      setSuccessMessage('Team created successfully!');

      // Refresh to show new data
      router.refresh();
    } catch (err) {
      console.error('Error creating team:', err);
      setError(err instanceof Error ? err.message : 'Failed to create team');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateTeam = async (teamId: string) => {
    if (!editTeamName.trim()) {
      setError('Team name is required');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const requestBody: { name: string; manager_id?: string | null } = {
        name: editTeamName.trim(),
        manager_id: editTeamManager || null
      };

      console.log('Updating team:', { teamId, requestBody });

      const response = await fetch(`/api/admin/teams/${teamId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update team');
      }

      console.log('Team updated:', result);

      // Reset form
      setEditingTeamId(null);
      setEditTeamName('');
      setEditTeamManager('');
      setSuccessMessage('Team updated successfully!');

      // Refresh to show new data
      router.refresh();
    } catch (err) {
      console.error('Error updating team:', err);
      setError(err instanceof Error ? err.message : 'Failed to update team');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTeam = async (teamId: string, teamName: string) => {
    if (!confirm(`Are you sure you want to delete team "${teamName}"? This cannot be undone.`)) {
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      console.log('Deleting team:', teamId);

      const response = await fetch(`/api/admin/teams/${teamId}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete team');
      }

      console.log('Team deleted:', result);

      setSuccessMessage('Team deleted successfully!');

      // Refresh to show new data
      router.refresh();
    } catch (err) {
      console.error('Error deleting team:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete team');
    } finally {
      setIsSubmitting(false);
    }
  };

  const startEditing = (team: TeamWithManager) => {
    setEditingTeamId(team.id);
    setEditTeamName(team.name);
    setEditTeamManager(team.manager_id || '');
    setError(null);
  };

  const cancelEditing = () => {
    setEditingTeamId(null);
    setEditTeamName('');
    setEditTeamManager('');
    setError(null);
  };

  const cancelCreating = () => {
    setIsCreating(false);
    setNewTeamName('');
    setNewTeamManager('');
    setError(null);
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Teams</h3>
        {!isCreating && (
          <button
            onClick={() => setIsCreating(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            + Create Team
          </button>
        )}
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
                Team Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Manager
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Members
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {isCreating && (
              <tr className="bg-blue-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <input
                    type="text"
                    value={newTeamName}
                    onChange={(e) => setNewTeamName(e.target.value)}
                    placeholder="Team name"
                    disabled={isSubmitting}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <select
                    value={newTeamManager}
                    onChange={(e) => setNewTeamManager(e.target.value)}
                    disabled={isSubmitting}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">No manager</option>
                    {managers.map((manager) => (
                      <option key={manager.id} value={manager.id}>
                        {manager.full_name || manager.email}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  -
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <div className="flex gap-2">
                    <button
                      onClick={handleCreateTeam}
                      disabled={isSubmitting}
                      className="text-blue-600 hover:text-blue-800 font-medium disabled:opacity-50"
                    >
                      {isSubmitting ? 'Creating...' : 'Create'}
                    </button>
                    <button
                      onClick={cancelCreating}
                      disabled={isSubmitting}
                      className="text-gray-600 hover:text-gray-800 font-medium disabled:opacity-50"
                    >
                      Cancel
                    </button>
                  </div>
                </td>
              </tr>
            )}

            {teams.map((team) => {
              const isEditing = editingTeamId === team.id;
              const teamMembers = allUsers.filter(user =>
                user.team_ids && user.team_ids.includes(team.id)
              );
              const memberCount = teamMembers.length;

              if (isEditing) {
                return (
                  <tr key={team.id} className="bg-blue-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="text"
                        value={editTeamName}
                        onChange={(e) => setEditTeamName(e.target.value)}
                        disabled={isSubmitting}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={editTeamManager}
                        onChange={(e) => setEditTeamManager(e.target.value)}
                        disabled={isSubmitting}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">No manager</option>
                        {managers.map((manager) => (
                          <option key={manager.id} value={manager.id}>
                            {manager.full_name || manager.email}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {memberCount} {memberCount === 1 ? 'member' : 'members'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleUpdateTeam(team.id)}
                          disabled={isSubmitting}
                          className="text-blue-600 hover:text-blue-800 font-medium disabled:opacity-50"
                        >
                          {isSubmitting ? 'Saving...' : 'Save'}
                        </button>
                        <button
                          onClick={cancelEditing}
                          disabled={isSubmitting}
                          className="text-gray-600 hover:text-gray-800 font-medium disabled:opacity-50"
                        >
                          Cancel
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              }

              return (
                <tr key={team.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {team.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {team.manager?.full_name || team.manager?.email || 'No manager assigned'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-600">
                      {memberCount > 0 ? (
                        <div className="flex flex-col gap-1">
                          <span className="font-medium">{memberCount} {memberCount === 1 ? 'member' : 'members'}</span>
                          <div className="text-xs text-gray-500">
                            {teamMembers.slice(0, 3).map(member => (
                              <div key={member.id}>{member.full_name || member.email}</div>
                            ))}
                            {memberCount > 3 && <div>+{memberCount - 3} more</div>}
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-400">No members</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex gap-3">
                      <button
                        onClick={() => startEditing(team)}
                        disabled={isSubmitting}
                        className="text-blue-600 hover:text-blue-800 font-medium disabled:opacity-50"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteTeam(team.id, team.name)}
                        disabled={isSubmitting}
                        className="text-red-600 hover:text-red-800 font-medium disabled:opacity-50"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
