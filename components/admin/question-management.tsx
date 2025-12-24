'use client';

import { useState } from 'react';
import type { Question } from '@/lib/types/database';

interface QuestionManagementProps {
  companyQuestions: Question[];
  teamQuestions?: Question[];
  teamId?: string;
  canManageTeamQuestions: boolean;
}

export function QuestionManagement({
  companyQuestions,
  teamQuestions = [],
  teamId,
  canManageTeamQuestions,
}: QuestionManagementProps) {
  const [activeTab, setActiveTab] = useState<'company' | 'team'>('company');
  const [isAdding, setIsAdding] = useState(false);

  const getQuestionTypeLabel = (type: string) => {
    const labels = {
      rating_1_5: 'Rating (1-5)',
      rating_1_10: 'Rating (1-10)',
      text: 'Text Response',
      yes_no: 'Yes/No',
    };
    return labels[type as keyof typeof labels] || type;
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Question Management</h3>
        <p className="text-sm text-gray-600 mt-1">
          Manage questions for 1-on-1 assessments
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex px-6">
          <button
            onClick={() => setActiveTab('company')}
            className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'company'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
            }`}
          >
            Company Questions ({companyQuestions.length})
          </button>
          {canManageTeamQuestions && teamId && (
            <button
              onClick={() => setActiveTab('team')}
              className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'team'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
              }`}
            >
              Team Questions ({teamQuestions.length})
            </button>
          )}
        </div>
      </div>

      {/* Questions List */}
      <div className="p-6">
        {activeTab === 'company' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-gray-600">
                These questions are asked to all team members across the company
              </p>
            </div>

            <div className="space-y-3">
              {companyQuestions.map((question, index) => (
                <div
                  key={question.id}
                  className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-medium text-gray-500">Q{index + 1}</span>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          question.is_active
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {question.is_active ? 'Active' : 'Inactive'}
                        </span>
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                          {getQuestionTypeLabel(question.question_type)}
                        </span>
                      </div>
                      <p className="text-gray-900 font-medium">{question.question_text}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'team' && canManageTeamQuestions && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-gray-600">
                Custom questions specific to your team
              </p>
              <button
                onClick={() => setIsAdding(true)}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                + Add Team Question
              </button>
            </div>

            {teamQuestions.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-gray-600 font-medium">No custom team questions yet</p>
                <p className="text-sm text-gray-500 mt-1">Add questions specific to your team's needs</p>
              </div>
            ) : (
              <div className="space-y-3">
                {teamQuestions.map((question, index) => (
                  <div
                    key={question.id}
                    className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm font-medium text-gray-500">TQ{index + 1}</span>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            question.is_active
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-600'
                          }`}>
                            {question.is_active ? 'Active' : 'Inactive'}
                          </span>
                          <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-medium">
                            {getQuestionTypeLabel(question.question_type)}
                          </span>
                        </div>
                        <p className="text-gray-900 font-medium">{question.question_text}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
