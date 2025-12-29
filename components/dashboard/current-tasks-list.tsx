'use client';

import Link from 'next/link';
import { ActionItem } from '@/lib/types/database';

interface CurrentTasksListProps {
  tasks: ActionItem[];
  maxItems?: number;
  completionRate?: number;
}

const statusConfig = {
  pending: {
    label: 'Pending',
    className: 'bg-yellow-50 text-yellow-700',
  },
  in_progress: {
    label: 'In progress',
    className: 'bg-orange-50 text-orange-700',
  },
  completed: {
    label: 'Done',
    className: 'bg-green-50 text-green-700',
  },
};

const taskIcons = ['😊', '🔍', '🖼', '📝', '🎯', '✏️', '🚀'];

export function CurrentTasksList({
  tasks,
  maxItems = 7,
  completionRate = 0,
}: CurrentTasksListProps) {
  const displayTasks = tasks.slice(0, maxItems);

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold text-gray-900">Current Tasks</h2>
          {completionRate > 0 && (
            <span className="px-3 py-1 bg-gray-100 text-gray-700 text-sm font-semibold rounded-md">
              Done {completionRate}%
            </span>
          )}
        </div>
        <select className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 bg-white hover:border-gray-300 transition-colors">
          <option>Week</option>
          <option>Month</option>
          <option>Quarter</option>
        </select>
      </div>

      <div className="space-y-0 divide-y divide-gray-100">
        {displayTasks.length > 0 ? (
          displayTasks.map((task, index) => (
            <div
              key={task.id}
              className="flex items-center gap-4 py-4 hover:pl-2 transition-all duration-200"
            >
              <div
                className={`w-11 h-11 rounded-lg flex items-center justify-center text-xl flex-shrink-0 ${
                  task.status === 'completed'
                    ? 'bg-green-50'
                    : task.status === 'in_progress'
                    ? 'bg-orange-50'
                    : 'bg-blue-50'
                }`}
              >
                {taskIcons[index % taskIcons.length]}
              </div>

              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-gray-900 text-sm mb-1 truncate">
                  {task.description}
                </h4>
              </div>

              <div className="flex items-center gap-3 flex-shrink-0">
                <span
                  className={`px-3 py-1 rounded-md text-xs font-semibold ${
                    statusConfig[task.status].className
                  }`}
                >
                  {statusConfig[task.status].label}
                </span>

                {task.due_date && (
                  <span className="text-xs text-gray-500 flex items-center gap-1">
                    <span>⏱</span>
                    {new Date(task.due_date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                )}

                <button className="w-8 h-8 rounded-md hover:bg-gray-100 flex items-center justify-center text-gray-500 hover:text-gray-700 transition-colors">
                  ⋯
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500">No current tasks</p>
          </div>
        )}
      </div>

      {tasks.length > maxItems && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <Link
            href="/dashboard#tasks"
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            View all {tasks.length} tasks →
          </Link>
        </div>
      )}
    </div>
  );
}
