'use client';

import { useState, useMemo } from 'react';
import { updateOneOnOneStatus } from '@/app/actions/one-on-ones';
import type { Question, Answer, Note, ActionItem } from '@/lib/types/database';
import { QuestionCard } from './question-card';
import { ActionItemsSection } from './action-items-section';
import { toast } from '@/components/ui/use-toast';

type QuestionCategory = 'research' | 'strategy' | 'core_qualities' | 'leadership' | 'technical';

interface OneOnOneWithRelations {
  id: string;
  month_year: string;
  status: string;
  developer_id: string;
  manager_id: string;
  developer_submitted_at: string | null;
  manager_reviewed_at: string | null;
  completed_at: string | null;
  developer: { id: string; email: string; full_name: string | null };
  manager: { id: string; email: string; full_name: string | null };
}

interface AnswerWithQuestion extends Answer {
  question: Question;
}

interface OneOnOneFormProps {
  oneOnOne: OneOnOneWithRelations;
  questions: Question[];
  existingAnswers: AnswerWithQuestion[];
  existingNotes: Note[];
  actionItems: ActionItem[];
  userRole: 'developer' | 'manager';
  userId: string;
}

export function OneOnOneForm({
  oneOnOne,
  questions,
  existingAnswers,
  existingNotes,
  actionItems,
  userRole,
  userId,
}: OneOnOneFormProps) {
  const [answers, setAnswers] = useState<Record<string, { rating?: number; text?: string }>>(
    () => {
      const initial: Record<string, { rating?: number; text?: string }> = {};
      existingAnswers
        .filter((a) => a.answer_type === userRole)
        .forEach((answer) => {
          initial[answer.question_id] = {
            rating: answer.rating_value || undefined,
            text: answer.text_value || undefined,
          };
        });
      return initial;
    }
  );

  const [notes, setNotes] = useState(() => {
    const noteType = userRole === 'developer' ? 'developer_notes' : 'manager_feedback';
    const existing = existingNotes.find((n) => n.note_type === noteType);
    return existing?.content || '';
  });

  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<QuestionCategory>('research');

  // Group questions by category
  const questionsByCategory = useMemo(() => {
    const grouped: Record<QuestionCategory, Question[]> = {
      research: [],
      strategy: [],
      core_qualities: [],
      leadership: [],
      technical: []
    };

    questions.forEach((question: any) => {
      const category = question.category as QuestionCategory;
      if (category && grouped[category]) {
        grouped[category].push(question);
      }
    });

    return grouped;
  }, [questions]);

  const categoryLabels: Record<QuestionCategory, string> = {
    research: 'Research',
    strategy: 'Strategy',
    core_qualities: 'Core Qualities',
    leadership: 'Leadership',
    technical: 'Technical'
  };

  const categoryIcons: Record<QuestionCategory, string> = {
    research: '🔍',
    strategy: '🎯',
    core_qualities: '⭐',
    leadership: '👥',
    technical: '⚙️'
  };

  const handleAnswerChange = (questionId: string, type: 'rating' | 'text', value: number | string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        [type]: value,
      },
    }));
  };

  const handleSaveDraft = async () => {
    setIsSaving(true);

    try {
      // Save all answers in a single batch request
      const answersToSave = Object.entries(answers)
        .filter(([_, answer]) => answer.rating !== undefined || answer.text)
        .map(([questionId, answer]) => ({
          question_id: questionId,
          rating_value: answer.rating,
          text_value: answer.text,
        }));

      if (answersToSave.length > 0) {
        const response = await fetch('/api/one-on-ones/answers/batch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            one_on_one_id: oneOnOne.id,
            answer_type: userRole,
            answers: answersToSave,
          }),
        });

        const result = await response.json();
        if (!response.ok) {
          throw new Error(result.error || 'Failed to save answers');
        }
      }

      // Save notes
      if (notes) {
        const noteType = userRole === 'developer' ? 'developer_notes' : 'manager_feedback';
        const response = await fetch('/api/one-on-ones/notes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            one_on_one_id: oneOnOne.id,
            note_type: noteType,
            content: notes,
            created_by: userId,
          }),
        });

        const result = await response.json();
        if (!response.ok) {
          throw new Error(result.error || 'Failed to save note');
        }
      }

      toast({
        variant: 'success',
        title: 'Draft saved',
        description: 'Your changes have been saved successfully.',
      });
    } catch (err) {
      console.error('Error saving draft:', err);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to save draft',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      // Save all answers in a single batch request
      const answersToSave = Object.entries(answers)
        .filter(([_, answer]) => answer.rating !== undefined || answer.text)
        .map(([questionId, answer]) => ({
          question_id: questionId,
          rating_value: answer.rating,
          text_value: answer.text,
        }));

      if (answersToSave.length > 0) {
        const response = await fetch('/api/one-on-ones/answers/batch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            one_on_one_id: oneOnOne.id,
            answer_type: userRole,
            answers: answersToSave,
          }),
        });

        const result = await response.json();
        if (!response.ok) {
          throw new Error(result.error || 'Failed to save answers');
        }
      }

      // Save notes
      if (notes) {
        const noteType = userRole === 'developer' ? 'developer_notes' : 'manager_feedback';
        const response = await fetch('/api/one-on-ones/notes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            one_on_one_id: oneOnOne.id,
            note_type: noteType,
            content: notes,
            created_by: userId,
          }),
        });

        const result = await response.json();
        if (!response.ok) {
          throw new Error(result.error || 'Failed to save note');
        }
      }

      // Update status
      if (userRole === 'developer' && oneOnOne.status === 'draft') {
        await updateOneOnOneStatus(oneOnOne.id, 'submitted');
        toast({
          variant: 'success',
          title: 'Success',
          description: '1-on-1 submitted successfully!',
        });
      } else if (userRole === 'manager' && oneOnOne.status === 'submitted') {
        await updateOneOnOneStatus(oneOnOne.id, 'completed');
        toast({
          variant: 'success',
          title: 'Success',
          description: '1-on-1 completed successfully!',
        });
      }

      // Redirect to dashboard after a brief delay
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 1500);
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to submit',
      });
      setIsSubmitting(false);
    }
  };

  const canEdit = () => {
    if (userRole === 'developer') {
      return oneOnOne.status === 'draft' || oneOnOne.status === 'submitted';
    }
    return oneOnOne.status === 'submitted' || oneOnOne.status === 'reviewed';
  };

  const getStatusBadge = () => {
    const badges = {
      draft: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Draft' },
      submitted: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Submitted' },
      reviewed: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Reviewed' },
      completed: { bg: 'bg-green-100', text: 'text-green-800', label: 'Completed' },
    };
    const badge = badges[oneOnOne.status as keyof typeof badges] || badges.draft;
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${badge.bg} ${badge.text}`}>
        {badge.label}
      </span>
    );
  };

  const readOnly = !canEdit();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {userRole === 'developer' ? 'Your Self-Assessment' : 'Team Member Review'}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {userRole === 'developer'
                ? 'Reflect on your progress and share your thoughts'
                : 'Review your team member\'s assessment and provide feedback'}
            </p>
          </div>
          {getStatusBadge()}
        </div>
      </div>

      {/* Category Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px overflow-x-auto">
            {(Object.keys(categoryLabels) as QuestionCategory[]).map((category) => {
              const count = questionsByCategory[category].length;
              if (count === 0) return null;

              return (
                <button
                  key={category}
                  onClick={() => setActiveTab(category)}
                  className={`
                    flex-1 min-w-max px-6 py-4 text-sm font-medium border-b-2 transition-colors
                    ${activeTab === category
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                    }
                  `}
                >
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-lg">{categoryIcons[category]}</span>
                    <span>{categoryLabels[category]}</span>
                    <span className={`
                      ml-2 px-2 py-0.5 rounded-full text-xs
                      ${activeTab === category
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-100 text-gray-600'
                      }
                    `}>
                      {count}
                    </span>
                  </div>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          <div className="space-y-4">
            {questionsByCategory[activeTab].map((question, index) => {
              const answer = answers[question.id] || {};
              const developerAnswer = existingAnswers.find(
                (a) => a.question_id === question.id && a.answer_type === 'developer'
              );
              const managerAnswer = existingAnswers.find(
                (a) => a.question_id === question.id && a.answer_type === 'manager'
              );

              return (
                <QuestionCard
                  key={question.id}
                  question={question}
                  index={index}
                  answer={answer}
                  developerAnswer={developerAnswer}
                  managerAnswer={managerAnswer}
                  userRole={userRole}
                  readOnly={readOnly}
                  onChange={(type, value) => handleAnswerChange(question.id, type, value)}
                />
              );
            })}
          </div>

          {questionsByCategory[activeTab].length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No questions in this category</p>
            </div>
          )}
        </div>
      </div>

      {/* Notes Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {userRole === 'developer' ? 'Additional Notes' : 'Manager Feedback'}
        </h3>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          disabled={readOnly}
          rows={6}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
          placeholder={
            userRole === 'developer'
              ? 'Any additional thoughts, concerns, or topics you\'d like to discuss...'
              : 'Your feedback, observations, and guidance for your team member...'
          }
        />

        {/* Show other person's notes if they exist */}
        {userRole === 'manager' && (
          <>
            {existingNotes.find((n) => n.note_type === 'developer_notes') && (
              <div className="mt-6">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Developer Notes:</h4>
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">
                    {existingNotes.find((n) => n.note_type === 'developer_notes')?.content}
                  </p>
                </div>
              </div>
            )}
          </>
        )}

        {userRole === 'developer' && oneOnOne.status !== 'draft' && (
          <>
            {existingNotes.find((n) => n.note_type === 'manager_feedback') && (
              <div className="mt-6">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Manager Feedback:</h4>
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">
                    {existingNotes.find((n) => n.note_type === 'manager_feedback')?.content}
                  </p>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Action Items Section */}
      <ActionItemsSection
        oneOnOneId={oneOnOne.id}
        actionItems={actionItems}
        userRole={userRole}
        developerId={oneOnOne.developer_id}
        managerId={oneOnOne.manager_id}
        currentUserId={userId}
        readOnly={readOnly}
      />

      {/* Action Buttons */}
      {!readOnly && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <button
              onClick={handleSaveDraft}
              disabled={isSaving || isSubmitting}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Save Draft'}
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSaving || isSubmitting}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
            >
              {isSubmitting
                ? 'Submitting...'
                : userRole === 'developer'
                ? 'Submit to Manager'
                : 'Complete Review'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
