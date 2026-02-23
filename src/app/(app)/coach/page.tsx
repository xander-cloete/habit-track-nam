import { createSupabaseServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import CoachingChat from '@/components/coach/CoachingChat';

export const metadata = { title: 'Coach — Habit Journal' };

export default async function CoachPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  return <CoachingChat />;
}
