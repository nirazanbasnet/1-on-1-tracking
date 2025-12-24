'use client';

import { useState } from 'react';
import { createActionItem, updateActionItem, deleteActionItem } from '@/app/actions/action-items';
import type { ActionItem } from '@/lib/types/database';

interface ActionItemsSectionProps {
  oneOnOneId: string;
  actionItems: ActionItem[];
  userRole: 'developer' | 'manager';
  developerId: string;
  managerId: string;
  currentUserId: string;
  readOnly: boolean;
}

export function ActionItemsSection({
  oneOnOneId,
  actionItems: initialActionItems,
  userRole,
  developerId,
  managerId,
  currentUserId,
  readOnly,
}: ActionItemsSectionProps) {
  const [actionItems, setActionItems] = useState(initialActionItems);
  const [isAdding, setIsAdding] = useState(false);
  const [newItemDescription, setNewItemDescription] = useState('');
  const [newItemAssignedTo, setNewItemAssignedTo] = useState<'developer' | 'manager'>('developer');
  const [newItemDueDate, setNewItemDueDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddItem = async () => {
    if (!newItemDescription.trim()) {
      setError('Description is required');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const newItem = await createActionItem(
        oneOnOneId,
        newItemDescription,
        newItemAssignedTo,
        newItemDueDate || undefined
      );

      setActionItems([newItem, ...actionItems]);
      setNewItemDescription('');
      setNewItemDueDate('');
      setIsAdding(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create action item');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateStatus = async (itemId: string, newStatus: 'pending' | 'in_progress' | 'completed') => {
    try {
      await updateActionItem(itemId, { status: newStatus });
      setActionItems(
        actionItems.map((item) =>
          item.id === itemId
            ? { ...item, status: newStatus, completed_at: newStatus === 'completed' ? new Date().toISOString() : item.completed_at }
            : item
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update action item');
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm('Are you sure you want to delete this action item?')) {
      return;
    }

    try {
      await deleteActionItem(itemId);
      setActionItems(actionItems.filter((item) => item.id !== itemId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete action item');
    }
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      pending: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Pending' },
      in_progress: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'In Progress' },
      completed: { bg: 'bg-green-100', text: 'text-green-700', label: 'Completed' },
    };
    return badges[status as keyof typeof badges] || badges.pending;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const isOverdue = (dueDate: string | null, status: string) => {
    if (!dueDate || status === 'completed') return false;
    return new Date(dueDate) < new Date();
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Action Items</h3>
        {!readOnly && !isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            + Add Action Item
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Add New Item Form */}
      {isAdding && (
        <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={newItemDescription}
                onChange={(e) => setNewItemDescription(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="What needs to be done?"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Assigned To</label>
                <select
                  value={newItemAssignedTo}
                  onChange={(e) => setNewItemAssignedTo(e.target.value as 'developer' | 'manager')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                >
                  <option value="developer">Developer</option>
                  <option value="manager">Manager</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Due Date (Optional)</label>
                <input
                  type="date"
                  value={newItemDueDate}
                  onChange={(e) => setNewItemDueDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleAddItem}
                disabled={isSubmitting}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {isSubmitting ? 'Adding...' : 'Add Item'}
              </button>
              <button
                onClick={() => {
                  setIsAdding(false);
                  setNewItemDescription('');
                  setNewItemDueDate('');
                  setError(null);
                }}
                disabled={isSubmitting}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Action Items List */}
      {actionItems.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-8">
          No action items yet. Add one to track follow-up tasks.
        </p>
      ) : (
        <div className="space-y-3">
          {actionItems.map((item) => {
            const badge = getStatusBadge(item.status);
            const isAssignedToCurrentUser =
              (item.assigned_to === 'developer' && currentUserId === developerId) ||
              (item.assigned_to === 'manager' && currentUserId === managerId);
            const overdue = isOverdue(item.due_date, item.status);

            return (
              <div
                key={item.id}
                className={`p-4 rounded-lg border-2 transition-all ${
                  item.status === 'completed'
                    ? 'bg-gray-50 border-gray-200'
                    : overdue
                    ? 'bg-red-50 border-red-200'
                    : 'bg-white border-gray-200'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${item.status === 'completed' ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                      {item.description}
                    </p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-600">
                      <span>
                        Assigned to: <span className="font-medium">{item.assigned_to === 'developer' ? 'Developer' : 'Manager'}</span>
                        {isAssignedToCurrentUser && <span className="text-blue-600"> (You)</span>}
                      </span>
                      {item.due_date && (
                        <span className={overdue ? 'text-red-600 font-medium' : ''}>
                          Due: {formatDate(item.due_date)}
                          {overdue && ' (Overdue)'}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!readOnly && isAssignedToCurrentUser && item.status !== 'completed' && (
                      <select
                        value={item.status}
                        onChange={(e) => handleUpdateStatus(item.id, e.target.value as any)}
                        className={`text-xs px-2 py-1 rounded-full font-medium border ${badge.bg} ${badge.text}`}
                      >
                        <option value="pending">Pending</option>
                        <option value="in_progress">In Progress</option>
                        <option value="completed">Completed</option>
                      </select>
                    )}
                    {(readOnly || !isAssignedToCurrentUser || item.status === 'completed') && (
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${badge.bg} ${badge.text}`}>
                        {badge.label}
                      </span>
                    )}
                    {!readOnly && (
                      <button
                        onClick={() => handleDeleteItem(item.id)}
                        className="text-xs text-red-600 hover:text-red-800"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
