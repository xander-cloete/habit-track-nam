import { createSupabaseServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import ProfilePage from '@/components/profile/ProfilePage';

export const metadata = { title: 'Profile — Habit Journal' };

export default async function Profile() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  return <ProfilePage />;
}
