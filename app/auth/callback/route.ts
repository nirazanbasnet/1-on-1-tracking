import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const origin = requestUrl.origin;

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error('Auth error:', error);
      return NextResponse.redirect(`${origin}/?error=auth_failed`);
    }

    if (data.user) {
      // Wait for the user sync trigger to create the app_users record
      // Retry up to 5 times with 500ms delay between attempts
      let attempts = 0;
      const maxAttempts = 5;
      let userProfile = null;

      while (attempts < maxAttempts && !userProfile) {
        const { data: profile } = await supabase
          .from('app_users')
          .select('id')
          .eq('id', data.user.id)
          .single();

        if (profile) {
          userProfile = profile;
          break;
        }

        // Wait 500ms before next attempt
        await new Promise(resolve => setTimeout(resolve, 500));
        attempts++;
      }

      if (!userProfile) {
        console.error('User profile not created after multiple attempts');
        return NextResponse.redirect(`${origin}/?error=profile_creation_failed`);
      }
    }
  }

  // URL to redirect to after sign in process completes
  return NextResponse.redirect(`${origin}/dashboard`);
}
