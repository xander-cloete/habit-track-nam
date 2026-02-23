'use client';

import { useState, useEffect } from 'react';

interface EntryCalendarProps {
  selectedDate: string; // YYYY-MM-DD
  onSelect: (date: string) => void;
}

function toYMD(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function firstDayOfMonth(year: number, month: number): number {
  // 0=Sun, adjusted so Mon=0
  const d = new Date(year, month, 1).getDay();
  return (d + 6) % 7; // Monday-first
}

const WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export default function EntryCalendar({ selectedDate, onSelect }: EntryCalendarProps) {
  const today = toYMD(new Date());

  // Anchor month to the selected date
  const [anchor, setAnchor] = useState(() => {
    const d = new Date(`${selectedDate}T00:00:00`);
    return { year: d.getFullYear(), month: d.getMonth() };
  });

  const [writtenDates, setWrittenDates] = useState<Set<string>>(new Set());

  // Sync anchor when selectedDate changes to a different month
  useEffect(() => {
    const d = new Date(`${selectedDate}T00:00:00`);
    setAnchor({ year: d.getFullYear(), month: d.getMonth() });
  }, [selectedDate]);

  // Fetch written dates for this month
  useEffect(() => {
    const { year, month } = anchor;
    const from = `${year}-${String(month + 1).padStart(2, '0')}-01`;
    const lastDay = daysInMonth(year, month);
    const to = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

    fetch(`/api/journal/dates?from=${from}&to=${to}`)
      .then((r) => r.json() as Promise<{ dates: string[] }>)
      .then((data) => setWrittenDates(new Set(data.dates ?? [])))
      .catch(() => { /* ignore */ });
  }, [anchor]);

  function prevMonth() {
    setAnchor(({ year, month }) => month === 0 ? { year: year - 1, month: 11 } : { year, month: month - 1 });
  }
  function nextMonth() {
    setAnchor(({ year, month }) => month === 11 ? { year: year + 1, month: 0 } : { year, month: month + 1 });
  }

  const { year, month } = anchor;
  const totalDays  = daysInMonth(year, month);
  const firstShift = firstDayOfMonth(year, month); // Mon-first offset
  const monthLabel = new Date(year, month, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  // Build grid cells (leading empties + days)
  const cells: (number | null)[] = [
    ...Array<null>(firstShift).fill(null),
    ...Array.from({ length: totalDays }, (_, i) => i + 1),
  ];

  return (
    <div
      className="paper-card p-4"
      style={{ minWidth: '200px' }}
    >
      {/* Month nav */}
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={prevMonth}
          className="font-hand text-base px-1.5 py-0.5 rounded"
          style={{ color: 'var(--color-ink-faint)' }}
          aria-label="Previous month"
        >
          ‹
        </button>
        <p className="font-hand text-sm text-center" style={{ color: 'var(--color-ink)' }}>
          {monthLabel}
        </p>
        <button
          onClick={nextMonth}
          className="font-hand text-base px-1.5 py-0.5 rounded"
          style={{ color: 'var(--color-ink-faint)' }}
          aria-label="Next month"
        >
          ›
        </button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 mb-1">
        {WEEKDAYS.map((wd, i) => (
          <p
            key={i}
            className="font-body text-center"
            style={{ color: 'var(--color-ink-faint)', fontSize: '0.6rem' }}
          >
            {wd}
          </p>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7 gap-y-0.5">
        {cells.map((day, i) => {
          if (!day) return <div key={`empty-${i}`} />;
          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const isToday    = dateStr === today;
          const isSelected = dateStr === selectedDate;
          const hasEntry   = writtenDates.has(dateStr);
          const isFuture   = dateStr > today;

          return (
            <button
              key={dateStr}
              onClick={() => !isFuture && onSelect(dateStr)}
              disabled={isFuture}
              className="relative flex flex-col items-center justify-center rounded"
              style={{
                height: '28px',
                backgroundColor: isSelected
                  ? 'var(--color-accent)'
                  : isToday
                  ? 'var(--color-accent-light)'
                  : 'transparent',
                cursor: isFuture ? 'not-allowed' : 'pointer',
                opacity: isFuture ? 0.3 : 1,
              }}
              aria-label={dateStr}
            >
              <span
                className="font-hand"
                style={{
                  fontSize: '0.7rem',
                  color: isSelected
                    ? '#ffffff'
                    : isToday
                    ? 'var(--color-accent)'
                    : 'var(--color-ink)',
                  lineHeight: 1,
                }}
              >
                {day}
              </span>
              {/* Dot indicator for entries */}
              {hasEntry && (
                <span
                  className="absolute rounded-full"
                  style={{
                    width: '3px',
                    height: '3px',
                    bottom: '2px',
                    backgroundColor: isSelected ? '#ffffff99' : 'var(--color-accent)',
                  }}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
