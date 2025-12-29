'use client';

import type { Question, Answer } from '@/lib/types/database';

interface QuestionCardProps {
  question: Question;
  index: number;
  answer: { rating?: number; text?: string };
  developerAnswer?: Answer;
  managerAnswer?: Answer;
  userRole: 'developer' | 'manager';
  readOnly: boolean;
  onChange: (type: 'rating' | 'text', value: number | string) => void;
}

export function QuestionCard({
  question,
  index,
  answer,
  developerAnswer,
  managerAnswer,
  userRole,
  readOnly,
  onChange,
}: QuestionCardProps) {
  const isRatingQuestion = question.question_type === 'rating_1_5';

  const renderRatingInput = () => {
    return (
      <div className="flex items-center gap-2">
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => !readOnly && onChange('rating', value)}
            disabled={readOnly}
            className={`w-12 h-12 rounded-lg border-2 font-semibold transition-all ${
              answer.rating === value
                ? 'border-blue-500 bg-blue-500 text-white'
                : 'border-gray-300 hover:border-blue-300 text-gray-700 disabled:hover:border-gray-300'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {value}
          </button>
        ))}
        <span className="ml-4 text-sm text-gray-500">
          {answer.rating ? (
            <span className="font-medium text-gray-700">
              {answer.rating === 1 && 'Very Low'}
              {answer.rating === 2 && 'Low'}
              {answer.rating === 3 && 'Average'}
              {answer.rating === 4 && 'High'}
              {answer.rating === 5 && 'Very High'}
            </span>
          ) : (
            'Not rated'
          )}
        </span>
      </div>
    );
  };

  const renderTextInput = () => {
    return (
      <textarea
        value={answer.text || ''}
        onChange={(e) => onChange('text', e.target.value)}
        disabled={readOnly}
        rows={4}
        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
        placeholder="Your answer..."
      />
    );
  };

  const renderOtherPersonAnswer = () => {
    const otherAnswer = userRole === 'developer' ? managerAnswer : developerAnswer;
    const otherRole = userRole === 'developer' ? 'Manager' : 'Developer';

    if (!otherAnswer) return null;

    // Show if there's either a rating or text
    if (!otherAnswer.rating_value && !otherAnswer.text_value) return null;

    return (
      <div className="mt-4 p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border-2 border-blue-200">
        <p className="text-xs font-semibold text-blue-700 mb-3">{otherRole}'s Response:</p>

        {/* Show rating if it exists */}
        {isRatingQuestion && otherAnswer.rating_value && (
          <div className="mb-3">
            <p className="text-xs text-gray-600 mb-2">Rating:</p>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((value) => (
                <div
                  key={value}
                  className={`w-10 h-10 rounded-lg border-2 font-semibold text-sm flex items-center justify-center ${
                    otherAnswer.rating_value === value
                      ? 'border-blue-600 bg-blue-600 text-white shadow-md'
                      : 'border-gray-300 bg-white text-gray-400'
                  }`}
                >
                  {value}
                </div>
              ))}
              <span className="ml-2 text-sm font-medium text-blue-700">
                {otherAnswer.rating_value === 1 && 'Very Low'}
                {otherAnswer.rating_value === 2 && 'Low'}
                {otherAnswer.rating_value === 3 && 'Average'}
                {otherAnswer.rating_value === 4 && 'High'}
                {otherAnswer.rating_value === 5 && 'Very High'}
              </span>
            </div>
          </div>
        )}

        {/* Show text if it exists */}
        {otherAnswer.text_value && (
          <div>
            <p className="text-xs text-gray-600 mb-2">Notes:</p>
            <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">{otherAnswer.text_value}</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-semibold text-sm">
          {index + 1}
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-medium text-gray-900 mb-4">{question.question_text}</h3>

          {/* Current user's answer */}
          <div className="mb-4">
            {isRatingQuestion ? renderRatingInput() : renderTextInput()}
          </div>

          {/* Show other person's answer if it exists */}
          {renderOtherPersonAnswer()}
        </div>
      </div>
    </div>
  );
}
