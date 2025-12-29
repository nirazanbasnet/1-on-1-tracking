'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { Team, AppUser } from '@/lib/types/database';
import { toast } from '@/components/ui/use-toast';

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

  const handleCreateTeam = async () => {
    if (!newTeamName.trim()) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Team name is required',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const requestBody: { name: string; manager_id?: string } = {
        name: newTeamName.trim()
      };

      if (newTeamManager) {
        requestBody.manager_id = newTeamManager;
      }

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

      // Reset form
      setNewTeamName('');
      setNewTeamManager('');
      setIsCreating(false);
      toast({
        variant: 'success',
        title: 'Success',
        description: 'Team created successfully!',
      });

      // Refresh to show new data
      router.refresh();
    } catch (err) {
      console.error('Error creating team:', err);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to create team',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateTeam = async (teamId: string) => {
    if (!editTeamName.trim()) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Team name is required',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const requestBody: { name: string; manager_id?: string | null } = {
        name: editTeamName.trim(),
        manager_id: editTeamManager || null
      };

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

      // Reset form
      setEditingTeamId(null);
      setEditTeamName('');
      setEditTeamManager('');
      toast({
        variant: 'success',
        title: 'Success',
        description: 'Team updated successfully!',
      });

      // Refresh to show new data
      router.refresh();
    } catch (err) {
      console.error('Error updating team:', err);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to update team',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTeam = async (teamId: string, teamName: string) => {
    if (!confirm(`Are you sure you want to delete team "${teamName}"? This cannot be undone.`)) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/admin/teams/${teamId}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete team');
      }

      toast({
        variant: 'success',
        title: 'Success',
        description: 'Team deleted successfully!',
      });

      // Refresh to show new data
      router.refresh();
    } catch (err) {
      console.error('Error deleting team:', err);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to delete team',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const startEditing = (team: TeamWithManager) => {
    setEditingTeamId(team.id);
    setEditTeamName(team.name);
    setEditTeamManager(team.manager_id || '');
  };

  const cancelEditing = () => {
    setEditingTeamId(null);
    setEditTeamName('');
    setEditTeamManager('');
  };

  const cancelCreating = () => {
    setIsCreating(false);
    setNewTeamName('');
    setNewTeamManager('');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Teams</h3>
          <p className="text-sm text-gray-600 mt-1">{teams.length} team{teams.length !== 1 ? 's' : ''} total</p>
        </div>
        {!isCreating && (
          <button
            onClick={() => setIsCreating(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Team
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Create New Team Card */}
        {isCreating && (
          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
            <h4 className="font-semibold text-gray-900 mb-4">New Team</h4>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Team Name</label>
                <input
                  type="text"
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  placeholder="Enter team name"
                  disabled={isSubmitting}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Manager</label>
                <select
                  value={newTeamManager}
                  onChange={(e) => setNewTeamManager(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">No manager</option>
                  {managers.map((manager) => (
                    <option key={manager.id} value={manager.id}>
                      {manager.full_name || manager.email}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={handleCreateTeam}
                  disabled={isSubmitting}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
                >
                  {isSubmitting ? 'Creating...' : 'Create'}
                </button>
                <button
                  onClick={cancelCreating}
                  disabled={isSubmitting}
                  className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors font-medium disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Team Cards */}
        {teams.map((team) => {
          const isEditing = editingTeamId === team.id;
          const teamMembers = allUsers.filter(user =>
            user.team_ids && user.team_ids.includes(team.id)
          );
          const memberCount = teamMembers.length;

          if (isEditing) {
            return (
              <div key={team.id} className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
                <h4 className="font-semibold text-gray-900 mb-4">Edit Team</h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Team Name</label>
                    <input
                      type="text"
                      value={editTeamName}
                      onChange={(e) => setEditTeamName(e.target.value)}
                      disabled={isSubmitting}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Manager</label>
                    <select
                      value={editTeamManager}
                      onChange={(e) => setEditTeamManager(e.target.value)}
                      disabled={isSubmitting}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">No manager</option>
                      {managers.map((manager) => (
                        <option key={manager.id} value={manager.id}>
                          {manager.full_name || manager.email}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => handleUpdateTeam(team.id)}
                      disabled={isSubmitting}
                      className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
                    >
                      {isSubmitting ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      onClick={cancelEditing}
                      disabled={isSubmitting}
                      className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors font-medium disabled:opacity-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            );
          }

          return (
            <div key={team.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h4 className="text-lg font-semibold text-gray-900">{team.name}</h4>
                  <div className="flex items-center gap-2 mt-2">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span className="text-sm text-gray-600">
                      {team.manager?.full_name || team.manager?.email || 'No manager assigned'}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => startEditing(team)}
                    disabled={isSubmitting}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
                    title="Edit"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDeleteTeam(team.id, team.name)}
                    disabled={isSubmitting}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                    title="Delete"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <span className="text-sm font-medium text-gray-700">
                      {memberCount} {memberCount === 1 ? 'member' : 'members'}
                    </span>
                  </div>
                </div>
                {memberCount > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {teamMembers.slice(0, 3).map(member => (
                      <span key={member.id} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                        {member.full_name || member.email}
                      </span>
                    ))}
                    {memberCount > 3 && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                        +{memberCount - 3} more
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
