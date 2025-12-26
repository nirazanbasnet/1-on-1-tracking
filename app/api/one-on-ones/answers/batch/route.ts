import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/auth/user-context';

/**
 * POST /api/one-on-ones/answers/batch
 * Save multiple answers at once
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const supabase = await createClient();

    const body = await request.json();
    const { one_on_one_id, answer_type, answers } = body;

    if (!one_on_one_id || !answer_type || !Array.isArray(answers)) {
      return NextResponse.json(
        { error: 'one_on_one_id, answer_type, and answers array are required' },
        { status: 400 }
      );
    }

    // Verify user has access to this 1-on-1
    const { data: oneOnOne } = await supabase
      .from('one_on_ones')
      .select('developer_id, manager_id, status')
      .eq('id', one_on_one_id)
      .single();

    if (!oneOnOne) {
      return NextResponse.json(
        { error: '1-on-1 not found' },
        { status: 404 }
      );
    }

    // Verify permissions
    const isDeveloper = user.id === oneOnOne.developer_id;
    const isManager = user.id === oneOnOne.manager_id;

    if (answer_type === 'developer' && !isDeveloper) {
      return NextResponse.json(
        { error: 'Only the developer can submit developer answers' },
        { status: 403 }
      );
    }

    if (answer_type === 'manager' && !isManager) {
      return NextResponse.json(
        { error: 'Only the manager can submit manager answers' },
        { status: 403 }
      );
    }

    // Process all answers in a single transaction
    const upsertData = answers
      .filter((answer: any) => answer.rating_value !== undefined || answer.text_value)
      .map((answer: any) => ({
        one_on_one_id,
        question_id: answer.question_id,
        answer_type,
        rating_value: answer.rating_value || null,
        text_value: answer.text_value || null,
      }));

    if (upsertData.length === 0) {
      return NextResponse.json({ success: true, saved: 0 });
    }

    // Use upsert to handle both insert and update
    const { error: upsertError } = await supabase
      .from('answers')
      .upsert(upsertData, {
        onConflict: 'one_on_one_id,question_id,answer_type',
        ignoreDuplicates: false,
      });

    if (upsertError) {
      console.error('Failed to save answers:', upsertError);
      return NextResponse.json(
        { error: `Failed to save answers: ${upsertError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      saved: upsertData.length,
    });
  } catch (error) {
    console.error('API: Unexpected error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
