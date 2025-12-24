import { redirect } from 'next/navigation';
import { getUser, signInWithGoogle } from '@/app/actions/auth';

type PageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function Home({ searchParams }: PageProps) {
  const user = await getUser();
  const params = await searchParams;
  const error = params.error as string | undefined;

  if (user) {
    redirect('/dashboard');
  }

  const errorMessages: Record<string, string> = {
    auth_failed: 'Authentication failed. Please try again.',
    profile_creation_failed: 'Failed to create user profile. Please contact support.',
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          1-on-1 Tracking Platform
        </h1>
        <p className="text-lg text-gray-600 mb-8">
          Engineering Growth & Performance Platform
        </p>
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md mx-auto">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {errorMessages[error] || 'An error occurred. Please try again.'}
            </div>
          )}
          <p className="text-gray-700 mb-4">
            Sign in with your Google account to continue
          </p>
          <form action={signInWithGoogle}>
            <button
              type="submit"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors w-full font-medium"
            >
              Sign in with Google
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
