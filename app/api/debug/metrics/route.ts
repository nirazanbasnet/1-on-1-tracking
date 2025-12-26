import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/auth/user-context';
import { calculateAndSaveMetrics } from '@/app/actions/metrics';

/**
 * GET /api/debug/metrics
 * Check metrics status for completed 1-on-1s
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const supabase = createAdminClient();

    // Get all completed 1-on-1s
    const { data: completedOneOnOnes } = await supabase
      .from('one_on_ones')
      .select('id, developer_id, manager_id, month_year, status, completed_at')
      .eq('status', 'completed')
      .order('month_year', { ascending: false });

    // Check which ones have metrics
    const results = await Promise.all(
      (completedOneOnOnes || []).map(async (oneOnOne) => {
        const { data: metrics } = await supabase
          .from('metrics_snapshots')
          .select('*')
          .eq('one_on_one_id', oneOnOne.id)
          .maybeSingle();

        // Check if it has answers
        const { data: answers, count: answerCount } = await supabase
          .from('answers')
          .select('*', { count: 'exact' })
          .eq('one_on_one_id', oneOnOne.id);

        return {
          one_on_one_id: oneOnOne.id,
          month_year: oneOnOne.month_year,
          developer_id: oneOnOne.developer_id,
          has_metrics: !!metrics,
          metrics_id: metrics?.id,
          answer_count: answerCount || 0,
          answers_sample: answers?.slice(0, 2),
          completed_at: oneOnOne.completed_at,
        };
      })
    );

    return NextResponse.json({
      total_completed: completedOneOnOnes?.length || 0,
      with_metrics: results.filter(r => r.has_metrics).length,
      without_metrics: results.filter(r => !r.has_metrics).length,
      details: results,
    });

  } catch (error) {
    console.error('Debug metrics error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to check metrics' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/debug/metrics
 * Recalculate metrics for a specific 1-on-1
 */
export async function POST(request: NextRequest) {
  try {
    await requireAuth();
    const { one_on_one_id } = await request.json();

    if (!one_on_one_id) {
      return NextResponse.json(
        { error: 'one_on_one_id is required' },
        { status: 400 }
      );
    }

    const result = await calculateAndSaveMetrics(one_on_one_id);

    return NextResponse.json({
      success: true,
      message: 'Metrics calculated successfully',
      data: result,
    });

  } catch (error) {
    console.error('Manual metrics calculation error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to calculate metrics' },
      { status: 500 }
    );
  }
}
