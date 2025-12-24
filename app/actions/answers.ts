'use server';

import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/auth/user-context';
import { revalidatePath } from 'next/cache';

/**
 * Save or update an answer to a question
 */
export async function saveAnswer(
  oneOnOneId: string,
  questionId: string,
  answerType: 'developer' | 'manager',
  ratingValue?: number,
  textValue?: string
) {
  const user = await requireAuth();
  const supabase = await createClient();

  // Verify user has access to this 1-on-1
  const { data: oneOnOne } = await supabase
    .from('one_on_ones')
    .select('developer_id, manager_id, status')
    .eq('id', oneOnOneId)
    .single();

  if (!oneOnOne) {
    throw new Error('1-on-1 not found');
  }

  // Verify permissions
  const isDeveloper = user.id === oneOnOne.developer_id;
  const isManager = user.id === oneOnOne.manager_id;

  if (answerType === 'developer' && !isDeveloper) {
    throw new Error('Only the developer can submit developer answers');
  }

  if (answerType === 'manager' && !isManager) {
    throw new Error('Only the manager can submit manager answers');
  }

  // Check if answer already exists
  const { data: existing } = await supabase
    .from('answers')
    .select('id')
    .eq('one_on_one_id', oneOnOneId)
    .eq('question_id', questionId)
    .eq('answer_type', answerType)
    .single();

  if (existing) {
    // Update existing answer
    const { error } = await supabase
      .from('answers')
      .update({
        rating_value: ratingValue,
        text_value: textValue,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id);

    if (error) {
      throw new Error(`Failed to update answer: ${error.message}`);
    }
  } else {
    // Create new answer
    const { error } = await supabase
      .from('answers')
      .insert({
        one_on_one_id: oneOnOneId,
        question_id: questionId,
        answer_type: answerType,
        rating_value: ratingValue,
        text_value: textValue,
      });

    if (error) {
      throw new Error(`Failed to save answer: ${error.message}`);
    }
  }

  revalidatePath(`/one-on-one/${oneOnOneId}`);
  return { success: true };
}

/**
 * Get all answers for a 1-on-1
 */
export async function getAnswers(oneOnOneId: string) {
  const user = await requireAuth();
  const supabase = await createClient();

  // Verify user has access to this 1-on-1
  const { data: oneOnOne } = await supabase
    .from('one_on_ones')
    .select('developer_id, manager_id')
    .eq('id', oneOnOneId)
    .single();

  if (!oneOnOne) {
    throw new Error('1-on-1 not found');
  }

  const isDeveloper = user.id === oneOnOne.developer_id;
  const isManager = user.id === oneOnOne.manager_id;
  const isAdmin = user.role === 'admin';

  if (!isDeveloper && !isManager && !isAdmin) {
    throw new Error('You do not have permission to view these answers');
  }

  const { data, error } = await supabase
    .from('answers')
    .select(`
      *,
      question:questions(*)
    `)
    .eq('one_on_one_id', oneOnOneId)
    .order('created_at');

  if (error) {
    throw new Error(`Failed to fetch answers: ${error.message}`);
  }

  return data || [];
}

/**
 * Save or update a note
 */
export async function saveNote(
  oneOnOneId: string,
  noteType: 'developer_notes' | 'manager_feedback',
  content: string
) {
  const user = await requireAuth();
  const supabase = await createClient();

  // Verify user has access to this 1-on-1
  const { data: oneOnOne } = await supabase
    .from('one_on_ones')
    .select('developer_id, manager_id')
    .eq('id', oneOnOneId)
    .single();

  if (!oneOnOne) {
    throw new Error('1-on-1 not found');
  }

  const isDeveloper = user.id === oneOnOne.developer_id;
  const isManager = user.id === oneOnOne.manager_id;

  if (noteType === 'developer_notes' && !isDeveloper) {
    throw new Error('Only the developer can save developer notes');
  }

  if (noteType === 'manager_feedback' && !isManager) {
    throw new Error('Only the manager can save manager feedback');
  }

  // Check if note already exists
  const { data: existing } = await supabase
    .from('notes')
    .select('id')
    .eq('one_on_one_id', oneOnOneId)
    .eq('note_type', noteType)
    .single();

  if (existing) {
    // Update existing note
    const { error } = await supabase
      .from('notes')
      .update({
        content,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id);

    if (error) {
      throw new Error(`Failed to update note: ${error.message}`);
    }
  } else {
    // Create new note
    const { error } = await supabase
      .from('notes')
      .insert({
        one_on_one_id: oneOnOneId,
        note_type: noteType,
        content,
      });

    if (error) {
      throw new Error(`Failed to save note: ${error.message}`);
    }
  }

  revalidatePath(`/one-on-one/${oneOnOneId}`);
  return { success: true };
}

/**
 * Get all notes for a 1-on-1
 */
export async function getNotes(oneOnOneId: string) {
  const user = await requireAuth();
  const supabase = await createClient();

  // Verify user has access to this 1-on-1
  const { data: oneOnOne } = await supabase
    .from('one_on_ones')
    .select('developer_id, manager_id')
    .eq('id', oneOnOneId)
    .single();

  if (!oneOnOne) {
    throw new Error('1-on-1 not found');
  }

  const isDeveloper = user.id === oneOnOne.developer_id;
  const isManager = user.id === oneOnOne.manager_id;
  const isAdmin = user.role === 'admin';

  if (!isDeveloper && !isManager && !isAdmin) {
    throw new Error('You do not have permission to view these notes');
  }

  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .eq('one_on_one_id', oneOnOneId)
    .order('created_at');

  if (error) {
    throw new Error(`Failed to fetch notes: ${error.message}`);
  }

  return data || [];
}

/**
 * Get all active questions
 */
export async function getActiveQuestions() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('questions')
    .select('*')
    .eq('is_active', true)
    .order('sort_order');

  if (error) {
    throw new Error(`Failed to fetch questions: ${error.message}`);
  }

  return data || [];
}
