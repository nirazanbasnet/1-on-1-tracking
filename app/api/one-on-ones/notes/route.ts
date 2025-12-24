import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/auth/user-context';

/**
 * POST /api/one-on-ones/notes
 * Save or update a note (developer notes or manager feedback)
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const { one_on_one_id, note_type, content, created_by } = body;

    if (!one_on_one_id || !note_type || content === undefined) {
      return NextResponse.json(
        { error: 'one_on_one_id, note_type, and content are required' },
        { status: 400 }
      );
    }

    if (!['developer_notes', 'manager_feedback'].includes(note_type)) {
      return NextResponse.json(
        { error: 'note_type must be developer_notes or manager_feedback' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Verify user has access to this 1-on-1
    const { data: oneOnOne, error: oneOnOneError } = await supabase
      .from('one_on_ones')
      .select('developer_id, manager_id')
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

    if (note_type === 'developer_notes' && !isDeveloper) {
      return NextResponse.json(
        { error: 'Only the developer can save developer notes' },
        { status: 403 }
      );
    }

    if (note_type === 'manager_feedback' && !isManager) {
      return NextResponse.json(
        { error: 'Only the manager can save manager feedback' },
        { status: 403 }
      );
    }

    console.log('Saving note:', { one_on_one_id, note_type, created_by: user.id });

    // Check if note already exists
    const { data: existing } = await supabase
      .from('notes')
      .select('id')
      .eq('one_on_one_id', one_on_one_id)
      .eq('note_type', note_type)
      .eq('created_by', created_by || user.id)
      .maybeSingle();

    let result;

    if (existing) {
      // Update existing note
      const { data, error } = await supabase
        .from('notes')
        .update({
          content,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) {
        console.error('Failed to update note:', error);
        return NextResponse.json(
          { error: `Failed to update note: ${error.message}` },
          { status: 500 }
        );
      }

      result = data;
      console.log('Note updated:', result);
    } else {
      // Create new note
      const { data, error } = await supabase
        .from('notes')
        .insert({
          one_on_one_id,
          note_type,
          content,
          created_by: created_by || user.id,
        })
        .select()
        .single();

      if (error) {
        console.error('Failed to create note:', error);
        return NextResponse.json(
          { error: `Failed to save note: ${error.message}` },
          { status: 500 }
        );
      }

      result = data;
      console.log('Note created:', result);
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
