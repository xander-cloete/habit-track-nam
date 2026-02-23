import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';

/**
 * Root page — smart redirect.
 * Authenticated + onboarded → /dashboard
 * Authenticated + not onboarded → /onboarding
 * Unauthenticated → /login
 */
export default async function RootPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const onboardingCompleted = user.user_metadata?.onboarding_completed;
  if (!onboardingCompleted) {
    redirect('/onboarding');
  }

  redirect('/dashboard');
}
