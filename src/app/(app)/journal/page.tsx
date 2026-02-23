import { createSupabaseServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import JournalEditor from '@/components/journal/JournalEditor';

export const metadata = { title: 'Journal — Habit Journal' };

export default async function JournalPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  return <JournalEditor />;
}
