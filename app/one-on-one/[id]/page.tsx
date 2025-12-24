import { redirect } from 'next/navigation';
import { getCurrentUserProfile } from '@/lib/auth/user-context';
import { getOneOnOneById } from '@/app/actions/one-on-ones';
import { getActiveQuestions, getAnswers, getNotes } from '@/app/actions/answers';
import { getActionItems } from '@/app/actions/action-items';
import { OneOnOneForm } from '@/components/one-on-one/one-on-one-form';

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

  const [questions, answers, notes, actionItems] = await Promise.all([
    getActiveQuestions(),
    getAnswers(id),
    getNotes(id),
    getActionItems(id),
  ]);

  const isDeveloper = profile.id === oneOnOne.developer_id;
  const isManager = profile.id === oneOnOne.manager_id;

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-4">
              <a
                href="/dashboard"
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                ← Back to Dashboard
              </a>
              <div className="h-6 w-px bg-gray-300" />
              <h1 className="text-xl font-semibold text-gray-900">
                {new Date(oneOnOne.month_year + '-01').toLocaleDateString('en-US', {
                  month: 'long',
                  year: 'numeric',
                })}{' '}
                1-on-1
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">
                {isDeveloper && `with ${oneOnOne.manager.full_name || oneOnOne.manager.email}`}
                {isManager && `with ${oneOnOne.developer.full_name || oneOnOne.developer.email}`}
              </span>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <OneOnOneForm
          oneOnOne={oneOnOne}
          questions={questions}
          existingAnswers={answers}
          existingNotes={notes}
          actionItems={actionItems}
          userRole={isDeveloper ? 'developer' : 'manager'}
          userId={profile.id}
        />
      </main>
    </div>
  );
}
