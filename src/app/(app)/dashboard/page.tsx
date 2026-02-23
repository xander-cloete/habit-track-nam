import { createSupabaseServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import GreetingHeader from '@/components/dashboard/GreetingHeader';
import HabitGrid from '@/components/habits/HabitGrid';
import DaySchedule from '@/components/schedule/DaySchedule';
import WeeklyStats from '@/components/dashboard/WeeklyStats';
import MotivationCard from '@/components/dashboard/MotivationCard';

export const metadata = { title: 'Dashboard — Habit Journal' };

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const displayName =
    (user.user_metadata?.display_name as string | undefined) ??
    user.email?.split('@')[0] ??
    'Friend';

  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

  return (
    <div className="p-5 lg:p-10 max-w-6xl mx-auto">
      <GreetingHeader displayName={displayName} date={today} />

      {/* Daily motivation — full width, above the grid */}
      <div className="mt-6">
        <MotivationCard />
      </div>

      <div className="mt-6 grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-6">
        {/* Left column: habits + stats */}
        <div className="space-y-6">
          <HabitGrid date={today} />
          <WeeklyStats date={today} monthDays={[]} />
        </div>
        {/* Right column: today's schedule */}
        <div className="space-y-6">
          <DaySchedule date={today} />
        </div>
      </div>
    </div>
  );
}
