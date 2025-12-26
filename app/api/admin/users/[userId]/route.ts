import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/auth/user-context';

/**
 * PATCH /api/admin/users/[userId]
 * Update user role and/or team assignments (supports multiple teams)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    // Verify admin access
    await requireAdmin();

    const body = await request.json();
    const { role, team_ids } = body;
    const { userId } = await params;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Use admin client to bypass RLS
    const supabase = createAdminClient();

    // Update role if provided
    if (role !== undefined) {
      if (!['admin', 'manager', 'developer'].includes(role)) {
        return NextResponse.json(
          { error: 'Invalid role. Must be admin, manager, or developer' },
          { status: 400 }
        );
      }

      const { error: roleError } = await supabase
        .from('app_users')
        .update({
          role,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (roleError) {
        console.error('API: Error updating role:', roleError);
        return NextResponse.json(
          { error: `Failed to update role: ${roleError.message}` },
          { status: 500 }
        );
      }
    }

    // Update team assignments if provided
    if (team_ids !== undefined) {
      // Delete existing team assignments
      const { error: deleteError } = await supabase
        .from('user_teams')
        .delete()
        .eq('user_id', userId);

      if (deleteError) {
        console.error('API: Error deleting team assignments:', deleteError);
        return NextResponse.json(
          { error: `Failed to delete team assignments: ${deleteError.message}` },
          { status: 500 }
        );
      }

      // Insert new team assignments if team_ids is not empty
      if (Array.isArray(team_ids) && team_ids.length > 0) {
        const teamAssignments = team_ids.map(teamId => ({
          user_id: userId,
          team_id: teamId
        }));

        const { error: insertError } = await supabase
          .from('user_teams')
          .insert(teamAssignments);

        if (insertError) {
          console.error('API: Error inserting team assignments:', insertError);
          return NextResponse.json(
            { error: `Failed to assign teams: ${insertError.message}` },
            { status: 500 }
          );
        }
      }
    }

    // Fetch updated user data with teams
    const { data: userData, error: fetchError } = await supabase
      .from('app_users')
      .select('id, email, full_name, role, created_at, updated_at')
      .eq('id', userId)
      .single();

    if (fetchError || !userData) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Fetch user's teams
    const { data: userTeams } = await supabase
      .from('user_teams')
      .select('team_id')
      .eq('user_id', userId);

    const data = {
      ...userData,
      team_ids: userTeams?.map(ut => ut.team_id) || []
    };

    // Revalidate the dashboard to ensure fresh data
    revalidatePath('/dashboard');

    return NextResponse.json({
      success: true,
      data
    });

  } catch (error) {
    console.error('API: Unexpected error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/users/[userId]
 * Get user details with team assignments
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    await requireAdmin();

    const { userId } = await params;
    const supabase = createAdminClient();

    const { data: userData, error } = await supabase
      .from('app_users')
      .select('id, email, full_name, role, created_at, updated_at')
      .eq('id', userId)
      .single();

    if (error || !userData) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Fetch user's teams
    const { data: userTeams } = await supabase
      .from('user_teams')
      .select('team_id')
      .eq('user_id', userId);

    const data = {
      ...userData,
      team_ids: userTeams?.map(ut => ut.team_id) || []
    };

    return NextResponse.json({ success: true, data });

  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
