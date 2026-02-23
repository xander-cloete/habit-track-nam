'use client';

/**
 * StreakCalendar — 30-day completion heatmap grid
 * Each day shown as a circle: empty = no data, tinted = partial, filled = all done
 */

export interface CalendarDay {
  date: string;   // YYYY-MM-DD
  pct: number;    // 0-100
}

interface StreakCalendarProps {
  days: CalendarDay[];
  today: string;  // YYYY-MM-DD
}

function dayColor(pct: number): { bg: string; border: string } {
  if (pct === 0)   return { bg: 'transparent',       border: 'var(--color-paper-ruled)' };
  if (pct < 40)   return { bg: '#F5E8D4',            border: '#D4B890' };
  if (pct < 80)   return { bg: '#E8C9A0',            border: '#C4A070' };
  return               { bg: 'var(--color-accent)',  border: 'var(--color-accent-hover)' };
}

export default function StreakCalendar({ days, today }: StreakCalendarProps) {
  return (
    <div className="flex flex-wrap gap-1.5" aria-label="30-day completion calendar">
      {days.map(({ date, pct }) => {
        const { bg, border } = dayColor(pct);
        const dayNum = parseInt(date.slice(8), 10);
        const isToday = date === today;

        return (
          <div
            key={date}
            title={`${date}: ${pct}% complete`}
            className="relative flex items-center justify-center rounded-full transition-transform hover:scale-110"
            style={{
              width: '28px',
              height: '28px',
              backgroundColor: bg,
              border: isToday
                ? `2px solid var(--color-accent)`
                : `1.5px solid ${border}`,
              boxShadow: isToday ? '0 0 0 2px rgba(196,113,58,0.25)' : undefined,
            }}
            aria-label={`${date} ${pct}%`}
          >
            <span
              className="font-hand"
              style={{
                fontSize: '10px',
                color: pct >= 80 ? '#ffffff' : 'var(--color-ink-faint)',
                lineHeight: 1,
              }}
            >
              {dayNum}
            </span>
          </div>
        );
      })}
    </div>
  );
}
