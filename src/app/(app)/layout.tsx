import type { ReactNode } from 'react';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';

export default async function AppLayout({ children }: { children: ReactNode }) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const displayName =
    (user.user_metadata?.display_name as string | undefined) ??
    user.email?.split('@')[0] ??
    'Friend';

  return (
    <div className="flex min-h-screen" style={{ background: 'var(--color-paper)' }}>
      {/* Sidebar — hidden on mobile, visible on lg+ */}
      <Sidebar
        displayName={displayName}
        email={user.email ?? ''}
      />

      {/* Main content area */}
      <main className="flex-1 graph-paper-bg-subtle min-h-screen pb-20 lg:pb-0">
        {children}
      </main>
    </div>
  );
}
