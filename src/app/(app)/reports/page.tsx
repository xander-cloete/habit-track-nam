import { createSupabaseServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import ReportsPage from '@/components/reports/ReportsPage';

export const metadata = { title: 'Reports — Habit Journal' };

export default async function ReportsPageRoute() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  return <ReportsPage />;
}
