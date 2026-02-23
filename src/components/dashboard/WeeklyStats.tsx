'use client';

import { useQuery } from '@tanstack/react-query';
import dynamic from 'next/dynamic';
import type { DayData } from '@/components/charts/RoughBarChart';
import type { CalendarDay } from '@/components/charts/StreakCalendar';

// Dynamic import — charts are client-only (rough.js uses DOM)
const RoughBarChart = dynamic(() => import('@/components/charts/RoughBarChart'), {
  ssr: false,
  loading: () => (
    <div
      className="animate-pulse rounded"
      style={{ height: '160px', backgroundColor: 'var(--color-paper-ruled)' }}
    />
  ),
});

const StreakCalendar = dynamic(() => import('@/components/charts/StreakCalendar'), {
  ssr: false,
});

interface WeeklyStatsProps {
  date: string;       // YYYY-MM-DD
  monthDays: string[]; // past-30-day YYYY-MM-DD strings (generated server-side or client)
}

interface WeeklyResponse {
  totalHabits: number;
  days: DayData[];
}

function useWeeklyStats(date: string) {
  return useQuery({
    queryKey: ['stats', 'weekly', date],
    queryFn: async (): Promise<WeeklyResponse> => {
      const res = await fetch(`/api/stats/weekly?date=${date}`);
      if (!res.ok) throw new Error('Failed to fetch stats');
      return (await res.json()) as WeeklyResponse;
    },
    staleTime: 60_000,
  });
}

// Also fetch 30-day logs for the calendar
function use30DayStats(startDate: string, endDate: string) {
  return useQuery({
    queryKey: ['stats', 'monthly', startDate, endDate],
    queryFn: async (): Promise<WeeklyResponse> => {
      const res = await fetch(`/api/stats/weekly?date=${endDate}&range=30`);
      if (!res.ok) throw new Error('Failed to fetch 30-day stats');
      return (await res.json()) as WeeklyResponse;
    },
    staleTime: 120_000,
  });
}

export default function WeeklyStats({ date }: WeeklyStatsProps) {
  const { data: weeklyData, isLoading } = useWeeklyStats(date);

  // Build 30-day calendar from weekly data + padding
  // For simplicity, use the 7-day data for the bar chart only.
  // The calendar will be derived from repeated weekly calls (or we call once for 30 days).
  const start30 = (() => {
    const d = new Date(`${date}T00:00:00Z`);
    d.setUTCDate(d.getUTCDate() - 29);
    return d.toISOString().slice(0, 10);
  })();

  const { data: monthlyData } = use30DayStats(start30, date);

  const calendarDays: CalendarDay[] = (monthlyData?.days ?? weeklyData?.days ?? []).map(
    (d) => ({ date: d.date, pct: d.pct }),
  );

  // Completion rate for this week
  const weekDays = weeklyData?.days ?? [];
  const thisWeekPct =
    weekDays.length > 0
      ? Math.round(weekDays.reduce((sum, d) => sum + d.pct, 0) / weekDays.length)
      : 0;

  const streak = (() => {
    let count = 0;
    for (let i = weekDays.length - 1; i >= 0; i--) {
      if ((weekDays[i]?.pct ?? 0) === 100) count++;
      else break;
    }
    return count;
  })();

  return (
    <section className="space-y-6">
      {/* ── Mini stat chips ──────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-3">
        {[
          {
            label: 'This Week',
            value: `${thisWeekPct}%`,
            sub: 'avg completion',
            color: 'var(--color-accent)',
          },
          {
            label: 'Streak',
            value: `${streak}d`,
            sub: streak === 1 ? 'day' : streak > 0 ? 'days 🔥' : 'keep going!',
            color: streak > 0 ? 'var(--color-accent)' : 'var(--color-ink-faint)',
          },
          {
            label: 'Habits',
            value: `${weeklyData?.totalHabits ?? '—'}`,
            sub: 'active',
            color: 'var(--color-accent-blue)',
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="paper-card p-3 text-center"
          >
            <div
              className="font-hand text-2xl font-bold"
              style={{ color: stat.color }}
            >
              {isLoading ? '…' : stat.value}
            </div>
            <div className="font-body text-xs mt-0.5" style={{ color: 'var(--color-ink-faint)' }}>
              {stat.sub}
            </div>
          </div>
        ))}
      </div>

      {/* ── 7-day bar chart ───────────────────────────────────────── */}
      <div className="paper-card p-4">
        <h3
          className="font-hand text-lg mb-3"
          style={{ color: 'var(--color-ink)' }}
        >
          This week
        </h3>
        {isLoading ? (
          <div
            className="animate-pulse rounded"
            style={{ height: '160px', backgroundColor: 'var(--color-paper-ruled)' }}
          />
        ) : weekDays.length > 0 ? (
          <RoughBarChart data={weekDays} today={date} />
        ) : (
          <p className="font-body text-sm text-center py-8" style={{ color: 'var(--color-ink-faint)' }}>
            Complete your first habit to see the chart
          </p>
        )}
      </div>

      {/* ── 30-day streak calendar ────────────────────────────────── */}
      {calendarDays.length > 0 && (
        <div className="paper-card p-4">
          <h3 className="font-hand text-lg mb-3" style={{ color: 'var(--color-ink)' }}>
            Last 30 days
          </h3>
          <StreakCalendar days={calendarDays} today={date} />
        </div>
      )}
    </section>
  );
}
