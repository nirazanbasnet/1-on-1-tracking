import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/auth/user-context';

/**
 * PATCH /api/admin/teams/[teamId]
 * Update team name and/or manager
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string }> }
) {
  try {
    // Verify admin access
    await requireAdmin();

    const body = await request.json();
    const { name, manager_id } = body;
    const { teamId } = await params;

    if (!teamId) {
      return NextResponse.json(
        { error: 'Team ID is required' },
        { status: 400 }
      );
    }

    // Use admin client to bypass RLS
    const supabase = createAdminClient();

    // Build update object
    const updateData: { name?: string; manager_id?: string | null; updated_at?: string } = {
      updated_at: new Date().toISOString()
    };

    if (name !== undefined) {
      if (!name.trim()) {
        return NextResponse.json(
          { error: 'Team name is required' },
          { status: 400 }
        );
      }
      updateData.name = name;
    }

    if (manager_id !== undefined) {
      updateData.manager_id = manager_id;
    }

    // Perform the update
    const { data, error } = await supabase
      .from('teams')
      .update(updateData)
      .eq('id', teamId)
      .select('id, name, manager_id, created_at, updated_at')
      .single();

    if (error) {
      console.error('API: Database error:', error);
      return NextResponse.json(
        { error: `Failed to update team: ${error.message}` },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Team not found' },
        { status: 404 }
      );
    }

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
 * DELETE /api/admin/teams/[teamId]
 * Delete a team (only if it has no members)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string }> }
) {
  try {
    await requireAdmin();

    const { teamId } = await params;
    const supabase = createAdminClient();

    // Check if team has any members (using user_teams junction table)
    const { data: userTeams, error: checkError } = await supabase
      .from('user_teams')
      .select('user_id')
      .eq('team_id', teamId);

    if (checkError) {
      return NextResponse.json(
        { error: `Failed to check team members: ${checkError.message}` },
        { status: 500 }
      );
    }

    if (userTeams && userTeams.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete team with assigned members. Please reassign them first.' },
        { status: 400 }
      );
    }

    // Delete the team
    const { error: deleteError } = await supabase
      .from('teams')
      .delete()
      .eq('id', teamId);

    if (deleteError) {
      return NextResponse.json(
        { error: `Failed to delete team: ${deleteError.message}` },
        { status: 500 }
      );
    }

    // Revalidate the dashboard
    revalidatePath('/dashboard');

    return NextResponse.json({
      success: true
    });

  } catch (error) {
    console.error('API: Unexpected error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
