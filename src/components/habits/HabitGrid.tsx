'use client';

import { useState } from 'react';
import Link from 'next/link';
import HabitCard from './HabitCard';
import { useHabits } from '@/hooks/useHabits';
import {
  useTodayLogs,
  useLogHabitForDate,
  useUnlogHabitForDate,
} from '@/hooks/useTodayLogs';
import type { Habit, HabitLog } from '@/lib/db/schema';

interface HabitGridProps {
  date: string; // YYYY-MM-DD
}

export default function HabitGrid({ date }: HabitGridProps) {
  const { data: habits = [], isLoading: habitsLoading } = useHabits();
  const { data: logs = [], isLoading: logsLoading } = useTodayLogs(date);
  const [pendingId, setPendingId] = useState<string | null>(null);

  const logMutation = useLogHabitForDate(date);
  const unlogMutation = useUnlogHabitForDate(date);

  const isLoading = habitsLoading || logsLoading;

  const activeHabits = (habits as Habit[]).filter(
    (h) => h.isActive !== false && !h.archivedAt,
  );

  const completedSet = new Set(
    (logs as HabitLog[]).map((l) => l.habitId),
  );

  const completedCount = activeHabits.filter((h) => completedSet.has(h.id)).length;
  const total = activeHabits.length;
  const allDone = total > 0 && completedCount === total;
  const progressPct = total > 0 ? Math.round((completedCount / total) * 100) : 0;

  async function handleToggle(habitId: string, completed: boolean) {
    setPendingId(habitId);
    try {
      if (completed) {
        await logMutation.mutateAsync({ habitId });
      } else {
        await unlogMutation.mutateAsync({ habitId });
      }
    } finally {
      setPendingId(null);
    }
  }

  return (
    <section>
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <h2 className="font-hand text-2xl" style={{ color: 'var(--color-ink)' }}>
          Today&apos;s Habits
        </h2>
        {!isLoading && total > 0 && (
          <span
            className="streak-badge"
            style={{
              color: allDone ? 'var(--color-accent)' : 'var(--color-ink)',
            }}
          >
            {completedCount} / {total} done {allDone ? '🔥' : ''}
          </span>
        )}
      </div>

      {/* Loading skeletons */}
      {isLoading && (
        <div className="flex flex-col gap-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="rounded-lg animate-pulse"
              style={{ height: '68px', backgroundColor: 'var(--color-paper-ruled)' }}
            />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && activeHabits.length === 0 && (
        <div className="paper-card p-8 flex flex-col items-center gap-3 text-center">
          <span className="text-4xl" aria-hidden="true">
            ✕
          </span>
          <p className="font-hand text-xl" style={{ color: 'var(--color-ink-light)' }}>
            No habits yet
          </p>
          <Link
            href="/habits"
            className="font-body text-sm px-4 py-2 rounded-lg"
            style={{
              backgroundColor: 'var(--color-accent)',
              color: '#ffffff',
              textDecoration: 'none',
            }}
          >
            Add your first habit
          </Link>
        </div>
      )}

      {/* Habit list */}
      {!isLoading && activeHabits.length > 0 && (
        <div className="flex flex-col gap-3">
          {activeHabits.map((habit) => (
            <HabitCard
              key={habit.id}
              habit={habit}
              isCompleted={completedSet.has(habit.id)}
              isLoading={pendingId === habit.id}
              onToggle={(id, completed) => void handleToggle(id, completed)}
              date={date}
            />
          ))}
        </div>
      )}

      {/* Progress bar */}
      {!isLoading && total > 0 && (
        <div className="mt-5">
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${progressPct}%` }} />
          </div>
        </div>
      )}
    </section>
  );
}
