import { createClient } from '@supabase/supabase-js';

/**
 * Service-role Supabase client for privileged server-side operations.
 * ONLY use this for operations that require bypassing RLS, such as
 * deleting auth users (admin.deleteUser).
 *
 * NEVER expose this client or SUPABASE_SERVICE_ROLE_KEY to the browser.
 */
export function createSupabaseAdminClient() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY environment variable is not set');
  }

  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession:   false,
      },
    }
  );
}
