import { redirect } from 'next/navigation';
import { getCurrentUserProfile } from '@/lib/auth/user-context';
import { getOneOnOneById } from '@/app/actions/one-on-ones';
import { getActiveQuestions, getAnswers, getNotes } from '@/app/actions/answers';
import { getActionItems } from '@/app/actions/action-items';
import { OneOnOneForm } from '@/components/one-on-one/one-on-one-form';
import { getMyNotifications, getUnreadNotificationCount } from '@/app/actions/notifications';
import { DashboardLayout } from '@/components/layout/dashboard-layout';

export default async function OneOnOnePage({ params }: { params: Promise<{ id: string }> }) {
  const profile = await getCurrentUserProfile();

  if (!profile) {
    redirect('/');
  }

  const { id } = await params;

  let oneOnOne;
  try {
    oneOnOne = await getOneOnOneById(id);
  } catch (error) {
    redirect('/dashboard');
  }

  const [questions, answers, notes, actionItems, notifications, unreadCount] = await Promise.all([
    getActiveQuestions(),
    getAnswers(id),
    getNotes(id),
    getActionItems(id),
    getMyNotifications(10),
    getUnreadNotificationCount(),
  ]);

  const isDeveloper = profile.id === oneOnOne.developer_id;
  const isManager = profile.id === oneOnOne.manager_id;

  return (
    <DashboardLayout
      userProfile={profile}
      notifications={notifications}
      unreadCount={unreadCount}
      currentPage="dashboard"
    >
      {/* Back Navigation */}
      <div className="mb-6">
        <a
          href="/dashboard"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors text-sm font-medium"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Dashboard
        </a>
      </div>

      {/* Session Header */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {new Date(oneOnOne.month_year + '-01').toLocaleDateString('en-US', {
                month: 'long',
                year: 'numeric',
              })}
            </h1>
            <p className="text-gray-600">
              {oneOnOne.title || `Session ${oneOnOne.session_number}`}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600 mb-1">
              {isDeveloper ? 'Manager' : 'Developer'}:
            </p>
            <p className="font-semibold text-gray-900">
              {isDeveloper
                ? (oneOnOne.manager.full_name || oneOnOne.manager.email)
                : (oneOnOne.developer.full_name || oneOnOne.developer.email)
              }
            </p>
          </div>
        </div>
      </div>

      {/* One-on-One Form */}
      <OneOnOneForm
        oneOnOne={oneOnOne}
        questions={questions}
        existingAnswers={answers}
        existingNotes={notes}
        actionItems={actionItems}
        userRole={isDeveloper ? 'developer' : 'manager'}
        userId={profile.id}
      />
    </DashboardLayout>
  );
}
