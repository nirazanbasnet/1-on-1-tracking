import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/auth/user-context';

/**
 * POST /api/manager/one-on-ones
 * Create a new 1-on-1 for a developer
 */
export async function POST(request: NextRequest) {
  try {
    // Verify user is authenticated
    const user = await requireAuth();

    // Verify the current user is a manager or admin
    if (user.role !== 'manager' && user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only managers and admins can create 1-on-1s' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { developer_id, month_year } = body;

    if (!developer_id || !month_year) {
      return NextResponse.json(
        { error: 'developer_id and month_year are required' },
        { status: 400 }
      );
    }

    // Use admin client to bypass RLS
    const supabase = createAdminClient();

    // Get the developer's info
    const { data: developer, error: devError } = await supabase
      .from('app_users')
      .select('id, email, full_name')
      .eq('id', developer_id)
      .single();

    if (devError || !developer) {
      console.error('Developer not found:', devError);
      return NextResponse.json(
        { error: 'Developer not found' },
        { status: 404 }
      );
    }

    // Get developer's first team assignment using user_teams
    const { data: userTeam, error: teamError } = await supabase
      .from('user_teams')
      .select(`
        team_id,
        teams!inner(
          id,
          name,
          manager_id
        )
      `)
      .eq('user_id', developer_id)
      .limit(1)
      .maybeSingle();

    if (teamError || !userTeam) {
      return NextResponse.json(
        { error: 'Developer is not assigned to a team' },
        { status: 400 }
      );
    }

    // Type assertion: Supabase returns teams as an object (not array) when using inner join with maybeSingle
    const team = userTeam.teams as unknown as { id: string; name: string; manager_id: string };

    // Verify the current user is the developer's manager (unless admin)
    const isTheirManager = team.manager_id === user.id;
    const isAdmin = user.role === 'admin';

    if (!isTheirManager && !isAdmin) {
      return NextResponse.json(
        { error: 'You can only create 1-on-1s for your team members' },
        { status: 403 }
      );
    }

    const managerId = team.manager_id;
    if (!managerId) {
      return NextResponse.json(
        { error: 'Team does not have a manager assigned' },
        { status: 400 }
      );
    }

    // Find the highest session number for this month to create next session
    const { data: existingSessions } = await supabase
      .from('one_on_ones')
      .select('session_number')
      .eq('developer_id', developer_id)
      .eq('manager_id', managerId)
      .eq('month_year', month_year)
      .order('session_number', { ascending: false })
      .limit(1);

    // Calculate next session number
    const nextSessionNumber = existingSessions && existingSessions.length > 0
      ? (existingSessions[0].session_number || 0) + 1
      : 1;

    // Create new 1-on-1 with session number
    const { data: newOneOnOne, error: insertError } = await supabase
      .from('one_on_ones')
      .insert({
        developer_id,
        manager_id: managerId,
        team_id: userTeam.team_id,
        month_year,
        session_number: nextSessionNumber,
        title: `Session ${nextSessionNumber}`,
        status: 'draft',
      })
      .select()
      .single();

    if (insertError) {
      console.error('Failed to create 1-on-1:', insertError);
      return NextResponse.json(
        { error: `Failed to create 1-on-1: ${insertError.message}` },
        { status: 500 }
      );
    }

    // Revalidate the dashboard
    revalidatePath('/dashboard');

    return NextResponse.json({
      success: true,
      data: newOneOnOne
    });

  } catch (error) {
    console.error('API: Unexpected error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
