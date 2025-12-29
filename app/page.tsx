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
    <div className="min-h-screen flex items-center justify-center bg-warmGray-100 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="relative z-10 w-full max-w-md px-6">
        {/* Logo/Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-900 rounded-2xl mb-6 shadow-lg">
            <span className="text-white text-2xl font-bold">1:1</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-3">
            Welcome Back
          </h1>
          <p className="text-gray-600">
            Track your growth, engage with your team
          </p>
        </div>

        {/* Sign In Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-warmGray-200">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-red-800">
                    {errorMessages[error] || 'An error occurred. Please try again.'}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Sign in to continue</h2>
            <p className="text-sm text-gray-600">
              Use your organization Google account
            </p>
          </div>

          <form action={signInWithGoogle}>
            <button
              type="submit"
              className="w-full bg-blue-600 text-white px-6 py-3.5 rounded-xl hover:bg-blue-700 transition-all duration-200 font-semibold shadow-md hover:shadow-lg transform hover:-translate-y-0.5 flex items-center justify-center gap-3"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Sign in with Google
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-warmGray-200">
            <p className="text-xs text-center text-gray-500">
              1-on-1 Tracking Platform for Engineering Teams
            </p>
          </div>
        </div>

        {/* Footer Note */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            By signing in, you agree to our terms of service
          </p>
        </div>
      </div>
    </div>
  );
}
