'use client';

import { useEffect, useState } from 'react';
import ScheduleBlock from './ScheduleBlock';
import type { ScheduleBlockData } from './ScheduleBlock';
import { useSchedule } from '@/hooks/useSchedule';

interface DayScheduleProps {
  date: string; // YYYY-MM-DD
}

function timeToMinutes(time: string): number {
  const [h = '0', m = '0'] = time.split(':');
  return parseInt(h, 10) * 60 + parseInt(m, 10);
}

function formatDateChip(dateStr: string): string {
  const d = new Date(`${dateStr}T00:00:00`);
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

export default function DaySchedule({ date }: DayScheduleProps) {
  // useSchedule takes (from: string, to: string) positional args
  const { data, isLoading } = useSchedule(date, date);

  const [currentMinutes, setCurrentMinutes] = useState<number>(() => {
    const now = new Date();
    return now.getHours() * 60 + now.getMinutes();
  });

  useEffect(() => {
    const id = setInterval(() => {
      const now = new Date();
      setCurrentMinutes(now.getHours() * 60 + now.getMinutes());
    }, 60_000);
    return () => clearInterval(id);
  }, []);

  const raw = (data as ScheduleBlockData[] | undefined) ?? [];
  const blocks = [...raw].sort(
    (a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime),
  );

  // Current time indicator
  const wakeMin = blocks.length > 0 ? timeToMinutes(blocks[0]!.startTime) : 6 * 60;
  const sleepMin =
    blocks.length > 0 ? timeToMinutes(blocks[blocks.length - 1]!.endTime) : 23 * 60;
  const totalMin = sleepMin - wakeMin;
  const showIndicator =
    totalMin > 0 && currentMinutes >= wakeMin && currentMinutes <= sleepMin;
  const indicatorPct = showIndicator
    ? ((currentMinutes - wakeMin) / totalMin) * 100
    : 0;

  return (
    <section>
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <h2 className="font-hand text-2xl" style={{ color: 'var(--color-ink)' }}>
          Today&apos;s Schedule
        </h2>
        <span
          className="streak-badge font-body text-xs"
          style={{
            color: 'var(--color-ink-faint)',
          }}
        >
          {formatDateChip(date)}
        </span>
      </div>

      {/* Loading skeletons */}
      {isLoading && (
        <div className="flex flex-col gap-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="rounded-r-md animate-pulse"
              style={{
                height: '60px',
                backgroundColor: 'var(--color-paper-ruled)',
                borderLeft: '4px solid var(--color-paper-dark)',
              }}
            />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && blocks.length === 0 && (
        <div className="paper-card p-8 flex flex-col items-center gap-2 text-center">
          <p className="font-hand text-xl" style={{ color: 'var(--color-ink-light)' }}>
            No schedule set up yet
          </p>
          <p className="font-body text-sm" style={{ color: 'var(--color-ink-faint)' }}>
            Your AI-generated schedule will appear here after onboarding
          </p>
        </div>
      )}

      {/* Schedule list with current-time indicator */}
      {!isLoading && blocks.length > 0 && (
        <div className="relative flex flex-col gap-3">
          {/* Red current-time line */}
          {showIndicator && (
            <div
              className="absolute left-0 right-0 z-10 pointer-events-none flex items-center gap-1"
              style={{ top: `${indicatorPct}%` }}
            >
              <div
                className="rounded-full flex-shrink-0"
                style={{ width: '8px', height: '8px', backgroundColor: '#C0392B' }}
              />
              <div
                style={{
                  flex: 1,
                  height: '1px',
                  backgroundColor: '#C0392B',
                  opacity: 0.7,
                }}
              />
            </div>
          )}

          {blocks.map((block) => (
            <ScheduleBlock key={block.id} block={block} />
          ))}
        </div>
      )}
    </section>
  );
}
