import { createSupabaseServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import WeekPlanner from '@/components/schedule/WeekPlanner';

export const metadata = { title: 'Planner — Habit Journal' };

export default async function PlannerPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  return <WeekPlanner />;
}
