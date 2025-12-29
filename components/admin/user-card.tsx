'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { AppUser, Team } from '@/lib/types/database';

interface UserCardProps {
  user: AppUser & { created_at: string; team_ids?: string[] };
  teams: Team[];
  currentUserId: string;
}

export function UserCard({ user, teams, currentUserId }: UserCardProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [selectedRole, setSelectedRole] = useState(user.role);
  const [selectedTeams, setSelectedTeams] = useState<string[]>(user.team_ids || []);
  const [currentRole, setCurrentRole] = useState(user.role);
  const [currentTeams, setCurrentTeams] = useState<string[]>(user.team_ids || []);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    setCurrentRole(user.role);
    setCurrentTeams(user.team_ids || []);
    setSelectedRole(user.role);
    setSelectedTeams(user.team_ids || []);
  }, [user.role, user.team_ids]);

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-100 text-purple-800';
      case 'manager':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-green-100 text-green-800';
    }
  };

  const handleSave = async () => {
    setIsUpdating(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const isOwnProfile = user.id === currentUserId;
      const roleChanged = selectedRole !== user.role;
      const teamsChanged = JSON.stringify(selectedTeams.sort()) !== JSON.stringify((user.team_ids || []).sort());

      if (roleChanged || teamsChanged) {
        const updateData: { role?: string; team_ids?: string[] } = {};

        if (roleChanged) {
          updateData.role = selectedRole;
        }

        if (teamsChanged) {
          updateData.team_ids = selectedTeams;
        }

        const response = await fetch(`/api/admin/users/${user.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updateData),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'Failed to update user');
        }

        setCurrentRole(selectedRole);
        setCurrentTeams(selectedTeams);
        router.refresh();

        if (isOwnProfile && roleChanged) {
          setSuccessMessage('Role updated! Refreshing page...');
          setTimeout(() => {
            window.location.reload();
          }, 1000);
        } else {
          setIsEditing(false);
          setSuccessMessage('Updated successfully!');
        }
      } else {
        setIsEditing(false);
        setSuccessMessage('No changes to save');
      }
    } catch (err) {
      console.error('Error updating user:', err);
      setError(err instanceof Error ? err.message : 'Failed to update user');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancel = () => {
    setSelectedRole(currentRole);
    setSelectedTeams(currentTeams);
    setIsEditing(false);
    setError(null);
    setSuccessMessage(null);
  };

  const toggleTeamSelection = (teamId: string) => {
    setSelectedTeams(prev =>
      prev.includes(teamId)
        ? prev.filter(id => id !== teamId)
        : [...prev, teamId]
    );
  };

  const isCurrentUser = user.id === currentUserId;

  if (isEditing) {
    return (
      <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
        <h4 className="font-semibold text-gray-900 mb-4">Edit User</h4>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <div className="text-sm text-gray-900 py-2">{user.email}</div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <div className="text-sm text-gray-900 py-2">{user.full_name || '-'}</div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value as 'developer' | 'manager' | 'admin')}
              disabled={isCurrentUser || isUpdating}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="developer">Developer</option>
              <option value="manager">Manager</option>
              <option value="admin">Admin</option>
            </select>
            {isCurrentUser && <p className="text-xs text-gray-500 mt-1">You cannot change your own role</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Teams</label>
            <div className="space-y-2 max-h-32 overflow-y-auto border border-gray-200 rounded-lg p-2">
              {teams.length === 0 ? (
                <div className="text-sm text-gray-500">No teams available</div>
              ) : (
                teams.map((team) => (
                  <label key={team.id} className="flex items-center space-x-2 cursor-pointer hover:bg-white p-2 rounded">
                    <input
                      type="checkbox"
                      checked={selectedTeams.includes(team.id)}
                      onChange={() => toggleTeamSelection(team.id)}
                      disabled={isUpdating}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">{team.name}</span>
                  </label>
                ))
              )}
            </div>
            {selectedTeams.length > 0 && (
              <p className="text-xs text-gray-500 mt-1">{selectedTeams.length} team(s) selected</p>
            )}
          </div>

          {error && <div className="text-red-600 text-sm">{error}</div>}
          {successMessage && <div className="text-green-600 text-sm">{successMessage}</div>}

          <div className="flex gap-2 pt-2">
            <button
              onClick={handleSave}
              disabled={isUpdating}
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
            >
              {isUpdating ? 'Saving...' : 'Save'}
            </button>
            <button
              onClick={handleCancel}
              disabled={isUpdating}
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
    <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="text-lg font-semibold text-gray-900">{user.full_name || user.email}</h4>
            {isCurrentUser && (
              <span className="px-2 py-0.5 bg-gray-200 text-gray-700 rounded text-xs font-medium">You</span>
            )}
          </div>
          <p className="text-sm text-gray-600">{user.email}</p>
        </div>
        <button
          onClick={() => setIsEditing(true)}
          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          title="Edit"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Role</span>
          <span className={`px-2 py-1 text-xs font-medium rounded-full capitalize ${getRoleBadgeColor(currentRole)}`}>
            {currentRole}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Teams</span>
          <div className="flex-1 ml-4">
            {currentTeams.length === 0 ? (
              <span className="text-sm text-gray-400">No teams</span>
            ) : (
              <div className="flex flex-wrap gap-1 justify-end">
                {currentTeams.map(teamId => {
                  const team = teams.find(t => t.id === teamId);
                  return team ? (
                    <span key={teamId} className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs">
                      {team.name}
                    </span>
                  ) : null;
                })}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-gray-200">
          <span className="text-xs text-gray-500">Joined</span>
          <span className="text-xs text-gray-600">{new Date(user.created_at).toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  );
}
