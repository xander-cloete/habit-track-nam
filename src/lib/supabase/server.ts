import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * Server-side Supabase client for Server Components and Route Handlers.
 * Reads session from cookies — must be called inside a request context.
 *
 * IMPORTANT: Always use supabase.auth.getUser() for auth decisions,
 * never getSession() — getUser() validates the JWT server-side.
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // setAll called from a Server Component — safe to ignore
            // Middleware will handle session refresh
          }
        },
      },
    }
  );
}
