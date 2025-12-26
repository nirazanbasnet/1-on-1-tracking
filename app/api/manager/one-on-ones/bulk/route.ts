import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/auth/user-context';

/**
 * POST /api/manager/one-on-ones/bulk
 * Create multiple 1-on-1s for team members at once
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
    const { developer_ids, month_year } = body;

    if (!developer_ids || !Array.isArray(developer_ids) || developer_ids.length === 0) {
      return NextResponse.json(
        { error: 'developer_ids must be a non-empty array' },
        { status: 400 }
      );
    }

    if (!month_year) {
      return NextResponse.json(
        { error: 'month_year is required' },
        { status: 400 }
      );
    }

    // Use admin client to bypass RLS
    const supabase = createAdminClient();

    let created = 0;
    let failed = 0;
    const errors: string[] = [];

    // Process each developer
    for (const developer_id of developer_ids) {
      try {
        // Get the developer's info
        const { data: developer, error: devError } = await supabase
          .from('app_users')
          .select('id, email, full_name')
          .eq('id', developer_id)
          .single();

        if (devError || !developer) {
          errors.push(`Developer ${developer_id}: not found`);
          failed++;
          continue;
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
          errors.push(`Developer ${developer.email}: not assigned to a team`);
          failed++;
          continue;
        }

        // Transform team data (handle both array and object formats)
        let team;
        if (Array.isArray(userTeam.teams) && userTeam.teams.length > 0) {
          team = userTeam.teams[0];
        } else if (userTeam.teams && !Array.isArray(userTeam.teams)) {
          team = userTeam.teams;
        } else {
          errors.push(`Developer ${developer.email}: team data invalid`);
          failed++;
          continue;
        }

        // Verify the current user is the developer's manager (unless admin)
        const isTheirManager = team.manager_id === user.id;
        const isAdmin = user.role === 'admin';

        if (!isTheirManager && !isAdmin) {
          errors.push(`Developer ${developer.email}: not your team member`);
          failed++;
          continue;
        }

        const managerId = team.manager_id;
        if (!managerId) {
          errors.push(`Developer ${developer.email}: team has no manager`);
          failed++;
          continue;
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
        const { error: insertError } = await supabase
          .from('one_on_ones')
          .insert({
            developer_id,
            manager_id: managerId,
            team_id: userTeam.team_id,
            month_year,
            session_number: nextSessionNumber,
            title: `Session ${nextSessionNumber}`,
            status: 'draft',
          });

        if (insertError) {
          errors.push(`Developer ${developer.email}: ${insertError.message}`);
          failed++;
          continue;
        }

        created++;
      } catch (err) {
        console.error(`Error creating 1-on-1 for developer ${developer_id}:`, err);
        errors.push(`Developer ${developer_id}: ${err instanceof Error ? err.message : 'Unknown error'}`);
        failed++;
      }
    }

    // Revalidate the dashboard
    revalidatePath('/dashboard');

    return NextResponse.json({
      success: true,
      created,
      failed,
      errors: errors.length > 0 ? errors : undefined,
      total: developer_ids.length
    });

  } catch (error) {
    console.error('API: Unexpected error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
