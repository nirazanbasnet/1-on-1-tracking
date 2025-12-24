'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { AppUser, Team } from '@/lib/types/database';

interface UserManagementRowProps {
  user: AppUser & { created_at: string; team_ids?: string[] };
  teams: Team[];
  currentUserId: string;
}

export function UserManagementRow({ user, teams, currentUserId }: UserManagementRowProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [selectedRole, setSelectedRole] = useState(user.role);
  const [selectedTeams, setSelectedTeams] = useState<string[]>(user.team_ids || []);
  // Current values displayed in view mode (updated immediately after save)
  const [currentRole, setCurrentRole] = useState(user.role);
  const [currentTeams, setCurrentTeams] = useState<string[]>(user.team_ids || []);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Update current values when props change (after server refresh)
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

      console.log('Saving user changes:', {
        userId: user.id,
        oldRole: user.role,
        newRole: selectedRole,
        oldTeams: user.team_ids,
        newTeams: selectedTeams,
        roleChanged,
        teamsChanged
      });

      // Only send update if something changed
      if (roleChanged || teamsChanged) {
        const updateData: { role?: string; team_ids?: string[] } = {};

        if (roleChanged) {
          updateData.role = selectedRole;
        }

        if (teamsChanged) {
          updateData.team_ids = selectedTeams;
        }

        // Call the API endpoint
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

        console.log('API response:', result);

        // Update current values immediately for instant UI feedback
        setCurrentRole(selectedRole);
        setCurrentTeams(selectedTeams);

        // Refresh the page data from server
        router.refresh();

        // If user updated their own role, show message to refresh
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
      <tr className="bg-blue-50">
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.email}</td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{user.full_name || '-'}</td>
        <td className="px-6 py-4 whitespace-nowrap">
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            disabled={isCurrentUser || isUpdating}
            className="px-2 py-1 text-xs font-medium rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="developer">developer</option>
            <option value="manager">manager</option>
            <option value="admin">admin</option>
          </select>
        </td>
        <td className="px-6 py-4">
          <div className="max-w-xs">
            <div className="text-xs font-medium text-gray-700 mb-2">Select Teams:</div>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {teams.length === 0 ? (
                <div className="text-xs text-gray-500">No teams available</div>
              ) : (
                teams.map((team) => (
                  <label key={team.id} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
                    <input
                      type="checkbox"
                      checked={selectedTeams.includes(team.id)}
                      onChange={() => toggleTeamSelection(team.id)}
                      disabled={isUpdating}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-xs text-gray-700">{team.name}</span>
                  </label>
                ))
              )}
            </div>
            {selectedTeams.length > 0 && (
              <div className="text-xs text-gray-500 mt-1">{selectedTeams.length} team(s) selected</div>
            )}
          </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
          {new Date(user.created_at).toLocaleDateString()}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm">
          {error && <div className="text-red-600 text-xs mb-2">{error}</div>}
          {successMessage && <div className="text-green-600 text-xs mb-2">{successMessage}</div>}
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={isUpdating}
              className="text-blue-600 hover:text-blue-800 font-medium disabled:opacity-50"
            >
              {isUpdating ? 'Saving...' : 'Save'}
            </button>
            <button
              onClick={handleCancel}
              disabled={isUpdating}
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
    <tr>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.email}</td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{user.full_name || '-'}</td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRoleBadgeColor(currentRole)}`}>
          {currentRole}
        </span>
      </td>
      <td className="px-6 py-4 text-sm text-gray-600">
        {currentTeams.length === 0 ? (
          <span className="text-gray-400">No teams</span>
        ) : (
          <div className="flex flex-wrap gap-1">
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
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
        {new Date(user.created_at).toLocaleDateString()}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm">
        <button
          onClick={() => setIsEditing(true)}
          className="text-blue-600 hover:text-blue-800 font-medium"
        >
          Edit
        </button>
        {isCurrentUser && <span className="ml-2 text-xs text-gray-500">(You)</span>}
      </td>
    </tr>
  );
}
