import { NextResponse, type NextRequest } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

/**
 * Supabase PKCE Auth Callback Route
 *
 * Handles the OAuth / email confirmation redirect from Supabase.
 * Exchanges the auth code for a session and sets cookies.
 *
 * Supabase redirects here after:
 * - Email confirmation (new registration)
 * - Password reset
 * - OAuth provider sign-in
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/dashboard';

  if (code) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Redirect to the intended destination
      const forwardedHost = request.headers.get('x-forwarded-host');
      const isLocalEnv = process.env.NODE_ENV === 'development';

      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${next}`);
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`);
      } else {
        return NextResponse.redirect(`${origin}${next}`);
      }
    }
  }

  // If code exchange failed, redirect to login with error
  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
