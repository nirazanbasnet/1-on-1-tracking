'use client';

import { UserManagementRow } from './user-management-row';
import type { AppUser, Team } from '@/lib/types/database';

interface UserCardsProps {
  users: (AppUser & { created_at: string; team_ids?: string[] })[];
  teams: Team[];
  currentUserId: string;
}

export function UserCards({ users, teams, currentUserId }: UserCardsProps) {
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {users.map((user) => (
          <UserManagementRow
            key={user.id}
            user={user}
            teams={teams}
            currentUserId={currentUserId}
          />
        ))}
      </div>
    </div>
  );
}
