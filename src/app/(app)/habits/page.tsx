import { createSupabaseServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import HabitList from '@/components/habits/HabitList';

export const metadata = { title: 'Habits — Habit Journal' };

export default async function HabitsPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  return <HabitList />;
}
