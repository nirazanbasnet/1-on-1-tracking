'use client';

import { useState } from 'react';
import { updateActionItem } from '@/app/actions/action-items';
import type { ActionItem } from '@/lib/types/database';

interface ActionItemWithOneOnOne extends ActionItem {
  one_on_one: {
    id: string;
    month_year: string;
    developer: { full_name: string | null; email: string };
    manager: { full_name: string | null; email: string };
  };
}

interface PendingActionItemsProps {
  actionItems: ActionItemWithOneOnOne[];
  userRole: 'developer' | 'manager';
}

export function PendingActionItems({ actionItems: initialActionItems, userRole }: PendingActionItemsProps) {
  const [actionItems, setActionItems] = useState(initialActionItems);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);

  const handleUpdateStatus = async (itemId: string, newStatus: 'pending' | 'in_progress' | 'completed') => {
    setIsUpdating(itemId);
    try {
      await updateActionItem(itemId, { status: newStatus });
      setActionItems(
        actionItems.map((item) =>
          item.id === itemId
            ? { ...item, status: newStatus, completed_at: newStatus === 'completed' ? new Date().toISOString() : item.completed_at }
            : item
        ).filter((item) => item.status !== 'completed') // Remove completed items
      );
    } catch (error) {
      console.error('Failed to update action item:', error);
    } finally {
      setIsUpdating(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      pending: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Pending' },
      in_progress: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'In Progress' },
    };
    return badges[status as keyof typeof badges] || badges.pending;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatMonthYear = (monthYear: string) => {
    const date = new Date(monthYear + '-01');
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const isOverdue = (dueDate: string | null) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  };

  const sortedItems = [...actionItems].sort((a, b) => {
    // Sort by: overdue first, then by due date, then by creation date
    const aOverdue = isOverdue(a.due_date);
    const bOverdue = isOverdue(b.due_date);

    if (aOverdue && !bOverdue) return -1;
    if (!aOverdue && bOverdue) return 1;

    if (a.due_date && b.due_date) {
      return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
    }

    if (a.due_date && !b.due_date) return -1;
    if (!a.due_date && b.due_date) return 1;

    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  if (actionItems.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Pending Action Items</h3>
        </div>
        <div className="p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-gray-600 font-medium">All caught up!</p>
          <p className="text-sm text-gray-500 mt-1">You have no pending action items.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Pending Action Items</h3>
          <p className="text-sm text-gray-600 mt-1">{actionItems.length} item{actionItems.length !== 1 ? 's' : ''} requiring your attention</p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full font-medium">
            {actionItems.filter(i => i.status === 'pending').length} Pending
          </span>
          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full font-medium">
            {actionItems.filter(i => i.status === 'in_progress').length} In Progress
          </span>
        </div>
      </div>
      <div className="divide-y divide-gray-200">
        {sortedItems.map((item) => {
          const badge = getStatusBadge(item.status);
          const overdue = isOverdue(item.due_date);
          const otherPerson = userRole === 'developer'
            ? item.one_on_one.manager.full_name || item.one_on_one.manager.email
            : item.one_on_one.developer.full_name || item.one_on_one.developer.email;

          return (
            <div
              key={item.id}
              className={`p-4 hover:bg-gray-50 transition-colors ${overdue ? 'bg-red-50' : ''}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <a
                      href={`/one-on-one/${item.one_on_one_id}`}
                      className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      {formatMonthYear(item.one_on_one.month_year)} 1-on-1 with {otherPerson}
                    </a>
                    {overdue && (
                      <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded-full">
                        Overdue
                      </span>
                    )}
                  </div>
                  <p className="text-gray-900 font-medium">{item.description}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-gray-600">
                    {item.due_date && (
                      <span className={overdue ? 'text-red-600 font-medium' : ''}>
                        Due: {formatDate(item.due_date)}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={item.status}
                    onChange={(e) => handleUpdateStatus(item.id, e.target.value as any)}
                    disabled={isUpdating === item.id}
                    className={`text-xs px-3 py-1.5 rounded-full font-medium border cursor-pointer disabled:opacity-50 ${badge.bg} ${badge.text}`}
                  >
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Complete</option>
                  </select>
                  <a
                    href={`/one-on-one/${item.one_on_one_id}`}
                    className="text-gray-400 hover:text-gray-600"
                    title="View 1-on-1"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </a>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
