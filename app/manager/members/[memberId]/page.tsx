import { redirect } from 'next/navigation';
import { getCurrentUserProfile, requireAuth } from '@/lib/auth/user-context';
import { createClient } from '@/lib/supabase/server';
import { SkillRadarChart } from '@/components/analytics/skill-radar-chart';
import { calculateCategoryScores, formatForRadarChart } from '@/lib/utils/category-analytics';

interface MemberDetailPageProps {
  params: Promise<{ memberId: string }>;
}

async function getMemberHistory(memberId: string, managerId: string) {
  const supabase = await createClient();

  // Get developer info
  const { data: developer } = await supabase
    .from('app_users')
    .select('id, email, full_name')
    .eq('id', memberId)
    .single();

  if (!developer) {
    return null;
  }

  // Verify manager has access to this developer
  const { data: userTeam } = await supabase
    .from('user_teams')
    .select(`
      team_id,
      teams!inner(
        id,
        name,
        manager_id
      )
    `)
    .eq('user_id', memberId)
    .limit(1)
    .maybeSingle();

  const team = userTeam && Array.isArray(userTeam.teams) && userTeam.teams.length > 0
    ? userTeam.teams[0]
    : userTeam?.teams as any;

  const isTheirManager = team?.manager_id === managerId;

  if (!isTheirManager) {
    return null;
  }

  // Get all completed 1-on-1s for this developer
  const { data: oneOnOnes } = await supabase
    .from('one_on_ones')
    .select(`
      id,
      month_year,
      session_number,
      title,
      status,
      completed_at,
      developer_submitted_at,
      manager_reviewed_at
    `)
    .eq('developer_id', memberId)
    .eq('status', 'completed')
    .order('month_year', { ascending: false })
    .order('session_number', { ascending: false });

  // Get answers with questions for each 1-on-1
  const oneOnOnesWithAnswers = await Promise.all(
    (oneOnOnes || []).map(async (oneOnOne) => {
      const { data: answers } = await supabase
        .from('answers')
        .select(`
          id,
          rating_value,
          text_value,
          question:questions!inner(
            id,
            question_text,
            category
          )
        `)
        .eq('one_on_one_id', oneOnOne.id);

      // Transform the data to match the expected type
      const transformedAnswers = (answers || []).map(answer => ({
        rating_value: answer.rating_value,
        question: Array.isArray(answer.question) ? answer.question[0] : answer.question
      }));

      const categoryScores = calculateCategoryScores(transformedAnswers);

      return {
        ...oneOnOne,
        answers: answers || [],
        categoryScores
      };
    })
  );

  return {
    developer,
    team,
    oneOnOnes: oneOnOnesWithAnswers
  };
}

export default async function MemberDetailPage({ params }: MemberDetailPageProps) {
  const user = await requireAuth();
  const { memberId } = await params;

  if (user.role !== 'manager' && user.role !== 'admin') {
    redirect('/dashboard');
  }

  const memberData = await getMemberHistory(memberId, user.id);

  if (!memberData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-4">You don't have permission to view this team member's data.</p>
          <a
            href="/dashboard"
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            Return to Dashboard
          </a>
        </div>
      </div>
    );
  }

  const { developer, team, oneOnOnes } = memberData;

  // Get most recent session for radar chart
  const latestSession = oneOnOnes[0];
  const radarData = latestSession ? formatForRadarChart(latestSession.categoryScores) : [];

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <a
              href="/dashboard"
              className="text-gray-600 hover:text-gray-900"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </a>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{developer.full_name || developer.email}</h1>
              <p className="text-sm text-gray-600">{team?.name || 'No team'}</p>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600">Total Sessions</p>
            <p className="text-3xl font-bold text-gray-900">{oneOnOnes.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600">Months Tracked</p>
            <p className="text-3xl font-bold text-gray-900">
              {new Set(oneOnOnes.map(o => o.month_year)).size}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600">Latest Rating</p>
            <p className="text-3xl font-bold text-gray-900">
              {latestSession?.categoryScores.length
                ? (latestSession.categoryScores.reduce((sum, c) => sum + c.averageRating, 0) / latestSession.categoryScores.length).toFixed(1)
                : 'N/A'}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600">Last Session</p>
            <p className="text-lg font-semibold text-gray-900">
              {latestSession
                ? new Date(latestSession.month_year + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
                : 'N/A'}
            </p>
          </div>
        </div>

        {/* Radar Chart */}
        {radarData.length > 0 && (
          <div className="mb-8">
            <SkillRadarChart
              data={radarData}
              userLabel={developer.full_name || developer.email}
              teamLabel="Previous Month"
            />
          </div>
        )}

        {/* Sessions History */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Session History</h3>
          </div>
          <div className="p-6">
            {oneOnOnes.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600">No completed sessions yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {oneOnOnes.map((session) => (
                  <div
                    key={session.id}
                    className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900">
                          {new Date(session.month_year + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                          {session.session_number > 1 && ` - Session ${session.session_number}`}
                        </h4>
                        {session.title && (
                          <p className="text-sm text-gray-600 mt-1">{session.title}</p>
                        )}
                        <p className="text-xs text-gray-500 mt-2">
                          Completed: {new Date(session.completed_at!).toLocaleDateString()}
                        </p>
                      </div>
                      <a
                        href={`/one-on-one/${session.id}`}
                        className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                      >
                        View Details →
                      </a>
                    </div>

                    {/* Category Scores */}
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                      {session.categoryScores.map((score) => (
                        <div key={score.categoryKey} className="text-center">
                          <p className="text-xs text-gray-600 mb-1">{score.category}</p>
                          <p className="text-xl font-bold text-gray-900">{score.averageRating.toFixed(1)}</p>
                          <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                            <div
                              className="bg-blue-600 h-2 rounded-full"
                              style={{ width: `${(score.averageRating / 5) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
