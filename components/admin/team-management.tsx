'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { Team, AppUser } from '@/lib/types/database';
import { toast } from '@/components/ui/use-toast';
import { Avatar } from '@/components/ui/avatar';

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

  useEffect(() => {
    setTeams(initialTeams);
  }, [initialTeams]);

  const [isCreating, setIsCreating] = useState(false);
  const [editingTeamId, setEditingTeamId] = useState<string | null>(null);
  const [managingMembersTeamId, setManagingMembersTeamId] = useState<string | null>(null);
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

      setNewTeamName('');
      setNewTeamManager('');
      setIsCreating(false);
      toast({
        variant: 'success',
        title: 'Success',
        description: 'Team created successfully!',
      });

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

      setEditingTeamId(null);
      setEditTeamName('');
      setEditTeamManager('');
      toast({
        variant: 'success',
        title: 'Success',
        description: 'Team updated successfully!',
      });

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

  const handleToggleMemberInTeam = async (userId: string, teamId: string, isCurrentlyMember: boolean) => {
    setIsSubmitting(true);
    try {
      const user = allUsers.find(u => u.id === userId);
      if (!user) throw new Error('User not found');

      const currentTeamIds = user.team_ids || [];
      const newTeamIds = isCurrentlyMember
        ? currentTeamIds.filter(id => id !== teamId)
        : [...currentTeamIds, teamId];

      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ team_ids: newTeamIds }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update user teams');
      }

      toast({
        variant: 'success',
        title: 'Success',
        description: isCurrentlyMember ? 'Member removed from team' : 'Member added to team',
      });

      router.refresh();
    } catch (err) {
      console.error('Error updating team members:', err);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to update team members',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-700 bg-clip-text text-transparent">
            Teams
          </h2>
          <p className="text-sm text-gray-500 mt-2 font-medium">
            {teams.length} active {teams.length === 1 ? 'team' : 'teams'}
          </p>
        </div>
        {!isCreating && (
          <button
            onClick={() => setIsCreating(true)}
            className="group relative px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40 transition-all duration-300 hover:scale-105 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Create Team</span>
            </div>
          </button>
        )}
      </div>

      {/* Teams Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {/* Create New Team Card */}
        {isCreating && (
          <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-[2px] shadow-lg hover:shadow-xl transition-all duration-300 animate-in fade-in slide-in-from-top-4">
            <div className="relative bg-white rounded-2xl p-6 h-full">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-400/20 to-purple-400/20 rounded-full blur-3xl"></div>

              <h4 className="text-lg font-bold text-gray-900 mb-6 relative">Create New Team</h4>

              <div className="space-y-4 relative">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Team Name</label>
                  <input
                    type="text"
                    value={newTeamName}
                    onChange={(e) => setNewTeamName(e.target.value)}
                    placeholder="e.g., Engineering Team"
                    disabled={isSubmitting}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all duration-200 disabled:bg-gray-50 disabled:cursor-not-allowed font-medium"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Team Manager</label>
                  <select
                    value={newTeamManager}
                    onChange={(e) => setNewTeamManager(e.target.value)}
                    disabled={isSubmitting}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all duration-200 disabled:bg-gray-50 disabled:cursor-not-allowed font-medium appearance-none bg-white"
                  >
                    <option value="">Select a manager...</option>
                    {managers.map((manager) => (
                      <option key={manager.id} value={manager.id}>
                        {manager.full_name || manager.email}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={handleCreateTeam}
                    disabled={isSubmitting}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95"
                  >
                    {isSubmitting ? 'Creating...' : 'Create Team'}
                  </button>
                  <button
                    onClick={cancelCreating}
                    disabled={isSubmitting}
                    className="px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Team Cards */}
        {teams.map((team, index) => {
          const isEditing = editingTeamId === team.id;
          const teamMembers = allUsers.filter(user =>
            user.team_ids && user.team_ids.includes(team.id)
          );
          const memberCount = teamMembers.length;

          const managerUser = team.manager_id
            ? allUsers.find(u => u.id === team.manager_id) || managers.find(m => m.id === team.manager_id)
            : null;

          if (isEditing) {
            return (
              <div
                key={team.id}
                className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 p-[2px] shadow-lg hover:shadow-xl transition-all duration-300 animate-in fade-in slide-in-from-top-4"
              >
                <div className="relative bg-white rounded-2xl p-6 h-full">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-amber-400/20 to-orange-400/20 rounded-full blur-3xl"></div>

                  <h4 className="text-lg font-bold text-gray-900 mb-6 relative">Edit Team</h4>

                  <div className="space-y-4 relative">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Team Name</label>
                      <input
                        type="text"
                        value={editTeamName}
                        onChange={(e) => setEditTeamName(e.target.value)}
                        disabled={isSubmitting}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 transition-all duration-200 disabled:bg-gray-50 disabled:cursor-not-allowed font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Team Manager</label>
                      <select
                        value={editTeamManager}
                        onChange={(e) => setEditTeamManager(e.target.value)}
                        disabled={isSubmitting}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 transition-all duration-200 disabled:bg-gray-50 disabled:cursor-not-allowed font-medium appearance-none bg-white"
                      >
                        <option value="">Select a manager...</option>
                        {managers.map((manager) => (
                          <option key={manager.id} value={manager.id}>
                            {manager.full_name || manager.email}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex gap-3 pt-4">
                      <button
                        onClick={() => handleUpdateTeam(team.id)}
                        disabled={isSubmitting}
                        className="flex-1 px-4 py-3 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-xl font-semibold shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95"
                      >
                        {isSubmitting ? 'Saving...' : 'Save Changes'}
                      </button>
                      <button
                        onClick={cancelEditing}
                        disabled={isSubmitting}
                        className="px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          }

          return (
            <div
              key={team.id}
              className="group relative overflow-hidden rounded-2xl bg-white p-6 shadow-lg hover:shadow-2xl transition-all duration-500 hover:scale-[1.02] border border-gray-100 animate-in fade-in slide-in-from-bottom-4"
              style={{
                animationDelay: `${index * 100}ms`,
                animationFillMode: 'backwards'
              }}
            >
              {/* Gradient Background Effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

              {/* Top Accent Line */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></div>

              <div className="relative">
                {/* Header */}
                <div className="flex items-start justify-between mb-6">
                  <div className="flex-1 mr-4">
                    <h3 className="text-xl font-bold text-gray-900 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-indigo-600 group-hover:to-purple-600 group-hover:bg-clip-text transition-all duration-300">
                      {team.name}
                    </h3>
                  </div>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300">
                    <button
                      onClick={() => startEditing(team)}
                      disabled={isSubmitting}
                      className="p-2.5 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-all duration-200 disabled:opacity-50 hover:scale-110 active:scale-95"
                      title="Edit team"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDeleteTeam(team.id, team.name)}
                      disabled={isSubmitting}
                      className="p-2.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-all duration-200 disabled:opacity-50 hover:scale-110 active:scale-95"
                      title="Delete team"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Manager Section */}
                <div className="mb-6 pb-6 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    {managerUser ? (
                      <>
                        <Avatar
                          email={managerUser.email}
                          fullName={managerUser.full_name}
                          avatarUrl={(managerUser as any).avatar_url}
                          size={40}
                          className="ring-2 ring-white shadow-sm"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-0.5">Team Manager</p>
                          <p className="text-sm font-bold text-gray-900 truncate">
                            {managerUser.full_name || managerUser.email}
                          </p>
                        </div>
                      </>
                    ) : (
                      <div className="flex items-center gap-3 text-gray-400">
                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wider mb-0.5">Team Manager</p>
                          <p className="text-sm font-medium">Not assigned</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Team Members */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-lg">
                        <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      </div>
                      <span className="text-sm font-bold text-gray-700">
                        {memberCount} {memberCount === 1 ? 'Member' : 'Members'}
                      </span>
                    </div>

                    {/* Activity Indicator */}
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-lg shadow-emerald-500/50"></div>
                      <span className="text-xs font-semibold text-emerald-600">Active</span>
                    </div>
                  </div>

                  {memberCount > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {teamMembers.slice(0, 4).map(member => (
                        <span
                          key={member.id}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg text-xs font-semibold text-gray-700 border border-gray-200 hover:border-indigo-300 hover:shadow-sm transition-all duration-200"
                        >
                          <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
                          {member.full_name || member.email.split('@')[0]}
                        </span>
                      ))}
                      {memberCount > 4 && (
                        <span className="inline-flex items-center px-3 py-1.5 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg text-xs font-bold text-indigo-600 border border-indigo-200">
                          +{memberCount - 4} more
                        </span>
                      )}
                    </div>
                  )}
                  {memberCount === 0 && (
                    <div className="text-center py-4">
                      <p className="text-sm text-gray-400 font-medium">No members yet</p>
                    </div>
                  )}

                  {/* Manage Members Button */}
                  <button
                    onClick={() => setManagingMembersTeamId(managingMembersTeamId === team.id ? null : team.id)}
                    className="mt-4 w-full py-2.5 px-4 bg-gradient-to-r from-indigo-50 to-purple-50 hover:from-indigo-100 hover:to-purple-100 text-indigo-600 rounded-lg font-semibold text-sm transition-all duration-200 border border-indigo-200 hover:border-indigo-300"
                  >
                    {managingMembersTeamId === team.id ? 'Hide Member Management' : 'Manage Members'}
                  </button>

                  {/* Member Management Section */}
                  {managingMembersTeamId === team.id && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-3 max-h-80 overflow-y-auto">
                      <h4 className="text-sm font-bold text-gray-900 mb-3">Add/Remove Members</h4>
                      {allUsers.length === 0 ? (
                        <p className="text-sm text-gray-500">No users available</p>
                      ) : (
                        <div className="space-y-2">
                          {allUsers.map(user => {
                            const isMember = user.team_ids?.includes(team.id) || false;
                            const isManager = user.id === team.manager_id;
                            return (
                              <div
                                key={user.id}
                                className="flex items-center justify-between p-3 bg-white rounded-lg hover:bg-gray-50 transition-colors border border-gray-100"
                              >
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                  <Avatar
                                    email={user.email}
                                    fullName={user.full_name}
                                    avatarUrl={user.avatar_url}
                                    size={32}
                                  />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-gray-900 truncate">
                                      {user.full_name || user.email}
                                    </p>
                                    <div className="flex items-center gap-2 mt-0.5">
                                      <span className="text-xs text-gray-500 capitalize">{user.role}</span>
                                      {isManager && (
                                        <span className="text-xs px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full font-medium">
                                          Manager
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                <button
                                  onClick={() => handleToggleMemberInTeam(user.id, team.id, isMember)}
                                  disabled={isSubmitting}
                                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
                                    isMember
                                      ? 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200'
                                      : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border border-indigo-200'
                                  }`}
                                >
                                  {isMember ? 'Remove' : 'Add'}
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {teams.length === 0 && !isCreating && (
        <div className="text-center py-16 px-4">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 mb-6">
            <svg className="w-10 h-10 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">No teams yet</h3>
          <p className="text-gray-500 mb-6 max-w-md mx-auto">Get started by creating your first team to organize your workspace</p>
          <button
            onClick={() => setIsCreating(true)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Your First Team
          </button>
        </div>
      )}
    </div>
  );
}
