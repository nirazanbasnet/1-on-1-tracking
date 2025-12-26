import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/auth/user-context';

/**
 * POST /api/admin/teams
 * Create a new team
 */
export async function POST(request: NextRequest) {
  try {
    // Verify admin access
    await requireAdmin();

    const body = await request.json();
    const { name, manager_id } = body;

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: 'Team name is required' },
        { status: 400 }
      );
    }

    // Use admin client to bypass RLS
    const supabase = createAdminClient();

    const teamData: { name: string; manager_id?: string } = { name: name.trim() };
    if (manager_id) {
      teamData.manager_id = manager_id;
    }

    // Create the team
    const { data, error } = await supabase
      .from('teams')
      .insert(teamData)
      .select('id, name, manager_id, created_at, updated_at')
      .single();

    if (error) {
      console.error('API: Database error:', error);
      return NextResponse.json(
        { error: `Failed to create team: ${error.message}` },
        { status: 500 }
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
