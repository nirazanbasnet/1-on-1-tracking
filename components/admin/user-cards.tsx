'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Avatar } from '@/components/ui/avatar';
import { useToast } from '@/components/ui/use-toast';
import type { AppUser, Team } from '@/lib/types/database';

interface UserCardsProps {
  users: (AppUser & { created_at: string; team_ids?: string[] })[];
  teams: Team[];
  currentUserId: string;
}

export function UserCards({ users, teams, currentUserId }: UserCardsProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);
  const [isUpdating, setIsUpdating] = useState(false);
  const [expandedTeamsUserId, setExpandedTeamsUserId] = useState<string | null>(null);

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

  const handleEdit = (user: AppUser & { team_ids?: string[] }) => {
    setEditingUserId(user.id);
    setSelectedRole(user.role);
    setSelectedTeams(user.team_ids || []);
  };

  const handleCancel = () => {
    setEditingUserId(null);
    setSelectedRole('');
    setSelectedTeams([]);
  };

  const handleSave = async (userId: string) => {
    setIsUpdating(true);

    try {
      const user = users.find(u => u.id === userId);
      if (!user) throw new Error('User not found');

      const roleChanged = selectedRole !== user.role;
      const teamsChanged = JSON.stringify(selectedTeams.sort()) !== JSON.stringify((user.team_ids || []).sort());

      if (!roleChanged && !teamsChanged) {
        toast({
          title: 'No changes',
          description: 'No changes to save',
        });
        handleCancel();
        return;
      }

      const updateData: { role?: string; team_ids?: string[] } = {};
      if (roleChanged) updateData.role = selectedRole;
      if (teamsChanged) updateData.team_ids = selectedTeams;

      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update user');
      }

      toast({
        variant: 'success',
        title: 'Success',
        description: 'User updated successfully',
      });

      handleCancel();
      router.refresh();

      // If user updated their own role, reload the page
      if (userId === currentUserId && roleChanged) {
        setTimeout(() => window.location.reload(), 1000);
      }
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to update user',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const toggleTeamSelection = (teamId: string) => {
    setSelectedTeams(prev =>
      prev.includes(teamId) ? prev.filter(id => id !== teamId) : [...prev, teamId]
    );
  };

  // Close expanded teams popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      // Check if click is outside any expanded teams popover
      if (expandedTeamsUserId && !target.closest('.teams-popover-container')) {
        setExpandedTeamsUserId(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [expandedTeamsUserId]);

  if (users.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-12">
        <div className="flex flex-col items-center text-center">
          <svg className="w-16 h-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          <p className="text-lg font-medium text-gray-900 mb-2">No users found</p>
          <p className="text-sm text-gray-500">Users will appear here after they sign up</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">All Users</h3>
          <p className="text-sm text-gray-600 mt-1">{users.length} user{users.length !== 1 ? 's' : ''} total</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="divide-y divide-gray-200">
          {users.map((user) => {
            const userTeams = (user.team_ids || [])
              .map(teamId => teams.find(t => t.id === teamId))
              .filter(Boolean) as Team[];

            const isEditing = editingUserId === user.id;
            const isCurrentUser = user.id === currentUserId;

            if (isEditing) {
              return (
                <div key={user.id} className="p-4 bg-blue-50">
                  <div className="flex items-start gap-4">
                    {/* Avatar */}
                    <Avatar
                      email={user.email}
                      fullName={user.full_name}
                      avatarUrl={user.avatar_url}
                      size={48}
                    />

                    {/* User Info & Edit Form */}
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Left: User Info */}
                      <div>
                        <h4 className="text-sm font-semibold text-gray-900 mb-1">
                          {user.full_name || user.email}
                        </h4>
                        <p className="text-xs text-gray-600">{user.email}</p>
                        {isCurrentUser && (
                          <span className="inline-block mt-1 px-2 py-0.5 bg-blue-200 text-blue-800 text-xs font-medium rounded">
                            You
                          </span>
                        )}
                      </div>

                      {/* Middle: Role Selector */}
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Role</label>
                        <select
                          value={selectedRole}
                          onChange={(e) => setSelectedRole(e.target.value)}
                          disabled={isCurrentUser || isUpdating}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                        >
                          <option value="developer">Developer</option>
                          <option value="manager">Manager</option>
                          <option value="admin">Admin</option>
                        </select>
                        {isCurrentUser && (
                          <p className="text-xs text-gray-500 mt-1">Cannot change your own role</p>
                        )}
                      </div>

                      {/* Right: Team Selector */}
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Teams ({selectedTeams.length} selected)
                        </label>
                        <div className="border border-gray-300 rounded-lg p-2 max-h-32 overflow-y-auto bg-white">
                          {teams.length === 0 ? (
                            <div className="text-xs text-gray-500">No teams available</div>
                          ) : (
                            <div className="space-y-1">
                              {teams.map((team) => (
                                <label
                                  key={team.id}
                                  className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-1 rounded"
                                >
                                  <input
                                    type="checkbox"
                                    checked={selectedTeams.includes(team.id)}
                                    onChange={() => toggleTeamSelection(team.id)}
                                    disabled={isUpdating}
                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                  />
                                  <span className="text-xs text-gray-700">{team.name}</span>
                                </label>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => handleSave(user.id)}
                        disabled={isUpdating}
                        className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isUpdating ? 'Saving...' : 'Save'}
                      </button>
                      <button
                        onClick={handleCancel}
                        disabled={isUpdating}
                        className="px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              );
            }

            return (
              <div key={user.id} className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors group">
                {/* Avatar */}
                <Link href={`/users/${user.id}`}>
                  <Avatar
                    email={user.email}
                    fullName={user.full_name}
                    avatarUrl={user.avatar_url}
                    size={48}
                  />
                </Link>

                {/* User Info */}
                <Link href={`/users/${user.id}`} className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-sm font-semibold text-gray-900 truncate">
                      {user.full_name || user.email}
                    </h4>
                    {isCurrentUser && (
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                        You
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 truncate">{user.email}</p>
                  {/* Mobile: Show team count */}
                  {userTeams.length > 0 && (
                    <div className="md:hidden mt-1 flex items-center gap-1">
                      <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      <span className="text-xs text-gray-500">
                        {userTeams.length} team{userTeams.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                  )}
                </Link>

                {/* Role Badge */}
                <div className="flex-shrink-0">
                  <span className={`px-3 py-1 text-xs font-medium rounded-full capitalize ${getRoleBadgeColor(user.role)}`}>
                    {user.role}
                  </span>
                </div>

                {/* Teams with Expandable Popover */}
                <div className="hidden md:block flex-shrink-0 min-w-[220px] relative">
                  {userTeams.length === 0 ? (
                    <span className="text-xs text-gray-400">No teams</span>
                  ) : (
                    <div className="relative teams-popover-container">
                      <div className="flex flex-wrap gap-1 items-center">
                        {userTeams.slice(0, 2).map((team) => (
                          <span
                            key={team.id}
                            className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium"
                          >
                            <svg className="w-3 h-3 mr-1 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            {team.name}
                          </span>
                        ))}
                        {userTeams.length > 2 && (
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              setExpandedTeamsUserId(expandedTeamsUserId === user.id ? null : user.id);
                            }}
                            className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium hover:bg-blue-200 transition-colors"
                          >
                            +{userTeams.length - 2} more
                            <svg
                              className={`w-3 h-3 ml-1 transition-transform ${expandedTeamsUserId === user.id ? 'rotate-180' : ''}`}
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                        )}
                      </div>

                      {/* Expanded Teams Dropdown */}
                      {expandedTeamsUserId === user.id && userTeams.length > 2 && (
                        <div className="absolute z-10 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 p-3">
                          <div className="flex items-center justify-between mb-2 pb-2 border-b border-gray-200">
                            <span className="text-xs font-semibold text-gray-700">
                              All Teams ({userTeams.length})
                            </span>
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                setExpandedTeamsUserId(null);
                              }}
                              className="text-gray-400 hover:text-gray-600"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                          <div className="space-y-1 max-h-48 overflow-y-auto">
                            {userTeams.map((team) => (
                              <div
                                key={team.id}
                                className="flex items-center gap-2 px-2 py-1.5 hover:bg-gray-50 rounded text-xs"
                              >
                                <svg className="w-3 h-3 text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                                <span className="text-gray-700 font-medium">{team.name}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Edit Button */}
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    handleEdit(user);
                  }}
                  className="flex-shrink-0 px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                >
                  Edit
                </button>

                {/* View Details Link */}
                <Link
                  href={`/users/${user.id}`}
                  className="flex-shrink-0 text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
