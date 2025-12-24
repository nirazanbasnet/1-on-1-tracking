import { createClient } from '@/lib/supabase/server';
import type { AppUser, AppUserWithTeam, Team } from '@/lib/types/database';

/**
 * Get the current authenticated user from Supabase auth
 */
export async function getCurrentAuthUser() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  return user;
}

/**
 * Get the current app user profile with team information
 */
export async function getCurrentUserProfile(): Promise<AppUserWithTeam | null> {
  const supabase = await createClient();

  // First get the auth user
  const authUser = await getCurrentAuthUser();
  if (!authUser) {
    return null;
  }

  // Get the app user profile - first try without the team join
  const { data: appUser, error } = await supabase
    .from('app_users')
    .select('*')
    .eq('id', authUser.id)
    .single();

  if (error || !appUser) {
    console.error('Error fetching user profile:', error);
    return null;
  }

  // Fetch user's first team (if they have any) using user_teams junction table
  const { data: userTeam } = await supabase
    .from('user_teams')
    .select(`
      team_id,
      teams(*)
    `)
    .eq('user_id', appUser.id)
    .limit(1)
    .maybeSingle();

  if (userTeam?.teams) {
    return { ...appUser, team: userTeam.teams } as AppUserWithTeam;
  }

  return appUser as AppUserWithTeam;
}

/**
 * Check if current user is an admin
 */
export async function isAdmin(): Promise<boolean> {
  const user = await getCurrentUserProfile();
  return user?.role === 'admin';
}

/**
 * Check if current user is a manager
 */
export async function isManager(): Promise<boolean> {
  const user = await getCurrentUserProfile();
  return user?.role === 'manager';
}

/**
 * Check if current user is a developer
 */
export async function isDeveloper(): Promise<boolean> {
  const user = await getCurrentUserProfile();
  return user?.role === 'developer';
}

/**
 * Get the team that the current user manages (if they're a manager)
 */
export async function getManagedTeam(): Promise<Team | null> {
  const user = await getCurrentUserProfile();
  if (user?.role !== 'manager') {
    return null;
  }

  const supabase = await createClient();
  const { data: team } = await supabase
    .from('teams')
    .select('*')
    .eq('manager_id', user.id)
    .single();

  return team;
}

/**
 * Get all team members for a manager
 */
export async function getTeamMembers(): Promise<AppUser[]> {
  const team = await getManagedTeam();
  if (!team) {
    return [];
  }

  const supabase = await createClient();
  // Use user_teams junction table to get team members
  const { data: userTeams } = await supabase
    .from('user_teams')
    .select(`
      user_id,
      app_users!inner(*)
    `)
    .eq('team_id', team.id)
    .order('app_users(full_name)');

  return userTeams?.map(ut => ut.app_users).filter(Boolean) || [];
}

/**
 * Require authentication - throws if user is not logged in
 */
export async function requireAuth() {
  const user = await getCurrentUserProfile();
  if (!user) {
    throw new Error('Unauthorized');
  }
  return user;
}

/**
 * Require admin role - throws if user is not an admin
 */
export async function requireAdmin() {
  const user = await requireAuth();
  if (user.role !== 'admin') {
    throw new Error('Admin access required');
  }
  return user;
}

/**
 * Require manager role - throws if user is not a manager
 */
export async function requireManager() {
  const user = await requireAuth();
  if (user.role !== 'manager') {
    throw new Error('Manager access required');
  }
  return user;
}
