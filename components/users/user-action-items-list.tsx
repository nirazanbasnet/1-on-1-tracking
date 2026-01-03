interface UserActionItemsListProps {
  actionItems: Array<{
    id: string;
    description: string;
    status: string;
    due_date: string | null;
    assigned_to: string;
    one_on_ones: {
      month_year: string;
      developer: { email: string; full_name: string | null };
      manager: { email: string; full_name: string | null };
    };
  }>;
  userRole: string;
}

export function UserActionItemsList({ actionItems, userRole }: UserActionItemsListProps) {
  const getStatusBadge = (status: string) => {
    const badges = {
      pending: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Pending' },
      in_progress: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'In Progress' },
      completed: { bg: 'bg-green-100', text: 'text-green-700', label: 'Completed' },
    };
    return badges[status as keyof typeof badges] || badges.pending;
  };

  const isOverdue = (dueDate: string | null, status: string) => {
    if (!dueDate || status === 'completed') return false;
    return new Date(dueDate) < new Date();
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const pendingItems = actionItems.filter(item => item.status !== 'completed');
  const completedItems = actionItems.filter(item => item.status === 'completed');

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-1">Action Items</h3>
        <p className="text-sm text-gray-600">
          {pendingItems.length} pending, {completedItems.length} completed
        </p>
      </div>

      {actionItems.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-sm text-gray-500">No action items assigned</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Pending Items */}
          {pendingItems.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Pending ({pendingItems.length})</h4>
              <div className="space-y-3">
                {pendingItems.map((item) => {
                  const badge = getStatusBadge(item.status);
                  const overdue = isOverdue(item.due_date, item.status);

                  return (
                    <div
                      key={item.id}
                      className={`p-4 rounded-lg border-2 ${
                        overdue ? 'bg-red-50 border-red-200' : 'bg-white border-gray-200'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900 mb-2">{item.description}</p>
                          <div className="flex items-center gap-3 text-xs text-gray-600">
                            <span>
                              From {new Date(item.one_on_ones.month_year + '-01').toLocaleDateString('en-US', {
                                month: 'short',
                                year: 'numeric',
                              })}
                            </span>
                            {item.due_date && (
                              <span className={overdue ? 'text-red-600 font-medium' : ''}>
                                Due: {formatDate(item.due_date)}
                                {overdue && ' (Overdue)'}
                              </span>
                            )}
                          </div>
                        </div>
                        <span className={`px-3 py-1 text-xs font-medium rounded-full ${badge.bg} ${badge.text} flex-shrink-0`}>
                          {badge.label}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Completed Items */}
          {completedItems.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Completed ({completedItems.length})</h4>
              <div className="space-y-3">
                {completedItems.slice(0, 5).map((item) => {
                  const badge = getStatusBadge(item.status);

                  return (
                    <div
                      key={item.id}
                      className="p-4 rounded-lg border border-gray-200 bg-gray-50"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-500 line-through mb-2">{item.description}</p>
                          <div className="flex items-center gap-3 text-xs text-gray-500">
                            <span>
                              From {new Date(item.one_on_ones.month_year + '-01').toLocaleDateString('en-US', {
                                month: 'short',
                                year: 'numeric',
                              })}
                            </span>
                          </div>
                        </div>
                        <span className={`px-3 py-1 text-xs font-medium rounded-full ${badge.bg} ${badge.text} flex-shrink-0`}>
                          {badge.label}
                        </span>
                      </div>
                    </div>
                  );
                })}
                {completedItems.length > 5 && (
                  <p className="text-xs text-gray-500 text-center pt-2">
                    +{completedItems.length - 5} more completed items
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
