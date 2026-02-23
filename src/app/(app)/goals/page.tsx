import { createSupabaseServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import GoalTree from '@/components/goals/GoalTree';

export const metadata = { title: 'Goals — Habit Journal' };

export default async function GoalsPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  return <GoalTree />;
}
