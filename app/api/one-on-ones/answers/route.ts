import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/auth/user-context';

/**
 * POST /api/one-on-ones/answers
 * Save or update an answer to a question
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const { one_on_one_id, question_id, answer_type, rating_value, text_value } = body;

    if (!one_on_one_id || !question_id || !answer_type) {
      return NextResponse.json(
        { error: 'one_on_one_id, question_id, and answer_type are required' },
        { status: 400 }
      );
    }

    if (!['developer', 'manager'].includes(answer_type)) {
      return NextResponse.json(
        { error: 'answer_type must be developer or manager' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Verify user has access to this 1-on-1
    const { data: oneOnOne, error: oneOnOneError } = await supabase
      .from('one_on_ones')
      .select('developer_id, manager_id, status')
      .eq('id', one_on_one_id)
      .single();

    if (oneOnOneError || !oneOnOne) {
      return NextResponse.json(
        { error: '1-on-1 not found' },
        { status: 404 }
      );
    }

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

    console.log('Saving answer:', { one_on_one_id, question_id, answer_type });

    // Check if answer already exists
    const { data: existing } = await supabase
      .from('answers')
      .select('id')
      .eq('one_on_one_id', one_on_one_id)
      .eq('question_id', question_id)
      .eq('answer_type', answer_type)
      .maybeSingle();

    let result;

    if (existing) {
      // Update existing answer
      const { data, error } = await supabase
        .from('answers')
        .update({
          rating_value,
          text_value,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) {
        console.error('Failed to update answer:', error);
        return NextResponse.json(
          { error: `Failed to update answer: ${error.message}` },
          { status: 500 }
        );
      }

      result = data;
      console.log('Answer updated:', result);
    } else {
      // Create new answer
      const { data, error } = await supabase
        .from('answers')
        .insert({
          one_on_one_id,
          question_id,
          answer_type,
          rating_value,
          text_value,
        })
        .select()
        .single();

      if (error) {
        console.error('Failed to create answer:', error);
        return NextResponse.json(
          { error: `Failed to save answer: ${error.message}` },
          { status: 500 }
        );
      }

      result = data;
      console.log('Answer created:', result);
    }

    revalidatePath(`/one-on-one/${one_on_one_id}`);

    return NextResponse.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('API: Unexpected error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
