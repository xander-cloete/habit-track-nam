import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * Next.js Proxy (formerly Middleware — renamed in Next.js 16)
 *
 * Responsibilities:
 * 1. Refresh the Supabase session on every request (prevents expired sessions)
 * 2. Redirect unauthenticated users from protected (app) routes → /login
 * 3. Redirect authenticated users from (auth) routes → /dashboard
 * 4. Redirect authenticated users who haven't completed onboarding → /onboarding
 */
export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: Always use getUser() not getSession() for auth decisions
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // Define route categories
  const isAuthRoute =
    pathname.startsWith('/login') ||
    pathname.startsWith('/register') ||
    pathname.startsWith('/forgot-password');

  const isOnboardingRoute = pathname.startsWith('/onboarding');

  const isProtectedRoute =
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/habits') ||
    pathname.startsWith('/schedule') ||
    pathname.startsWith('/planner') ||
    pathname.startsWith('/goals') ||
    pathname.startsWith('/reports') ||
    pathname.startsWith('/settings');

  // ── Unauthenticated user hitting protected route ───────────────────────────
  if (!user && isProtectedRoute) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/login';
    redirectUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // ── Authenticated user hitting auth pages ──────────────────────────────────
  if (user && isAuthRoute) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/dashboard';
    return NextResponse.redirect(redirectUrl);
  }

  // ── Authenticated user on protected route: check onboarding status ─────────
  if (user && isProtectedRoute && !isOnboardingRoute) {
    // Check onboarding completion via user metadata (set after onboarding)
    const onboardingCompleted = user.user_metadata?.onboarding_completed;

    if (!onboardingCompleted) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = '/onboarding';
      return NextResponse.redirect(redirectUrl);
    }
  }

  // ── Authenticated user with completed onboarding hitting /onboarding ───────
  if (user && isOnboardingRoute) {
    const onboardingCompleted = user.user_metadata?.onboarding_completed;
    if (onboardingCompleted) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = '/dashboard';
      return NextResponse.redirect(redirectUrl);
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - public folder assets
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
