'use client';

import { useState } from 'react';
import { useSchedule, useDeleteBlock } from '@/hooks/useSchedule';
import ScheduleBlock, { type ScheduleBlockData } from './ScheduleBlock';
import BlockForm from './BlockForm';
import WorkScheduleForm from './WorkScheduleForm';

// ── Date helpers ───────────────────────────────────────────────────────────────
function toYMD(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Return the Monday of the week containing `date` (YYYY-MM-DD) */
function weekStart(dateStr: string): string {
  const d = new Date(`${dateStr}T00:00:00`);
  const day = d.getDay(); // 0=Sun
  const diff = day === 0 ? -6 : 1 - day; // shift to Monday
  d.setDate(d.getDate() + diff);
  return toYMD(d);
}

/** Add `n` days to a YYYY-MM-DD string */
function addDays(dateStr: string, n: number): string {
  const d = new Date(`${dateStr}T00:00:00`);
  d.setDate(d.getDate() + n);
  return toYMD(d);
}

function formatDay(dateStr: string): { weekday: string; day: string; month: string } {
  const d = new Date(`${dateStr}T00:00:00`);
  return {
    weekday: d.toLocaleDateString('en-US', { weekday: 'short' }),
    day:     d.toLocaleDateString('en-US', { day: '2-digit' }),
    month:   d.toLocaleDateString('en-US', { month: 'short' }),
  };
}

function formatHeaderRange(monday: string): string {
  const sunday = addDays(monday, 6);
  const from = new Date(`${monday}T00:00:00`);
  const to   = new Date(`${sunday}T00:00:00`);
  const fromStr = from.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const toStr   = to.toLocaleDateString('en-US',   { month: 'short', day: 'numeric', year: 'numeric' });
  return `${fromStr} – ${toStr}`;
}

// ── Component ──────────────────────────────────────────────────────────────────
export default function WeekPlanner() {
  const today = toYMD(new Date());
  const [anchorMonday, setAnchorMonday]   = useState(() => weekStart(today));
  const [addingForDate, setAddingForDate] = useState<string | null>(null);
  const [showWorkForm, setShowWorkForm]   = useState(false);

  const sunday = addDays(anchorMonday, 6);
  const { data: blocks = [], isLoading } = useSchedule(anchorMonday, sunday);
  const deleteBlock = useDeleteBlock();

  // Build 7-day array
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(anchorMonday, i));

  // Group blocks by date — the API response includes blockDate as a string field
  type WireBlock = ScheduleBlockData & { blockDate: string };
  const byDate: Record<string, ScheduleBlockData[]> = {};
  (blocks as WireBlock[]).forEach((b) => {
    const d = b.blockDate;
    if (!byDate[d]) byDate[d] = [];
    byDate[d].push(b);
  });

  function prevWeek() { setAnchorMonday((m) => addDays(m, -7)); }
  function nextWeek() { setAnchorMonday((m) => addDays(m, 7));  }
  function goToday()  { setAnchorMonday(weekStart(today)); }

  return (
    <>
      {/* Block form modal */}
      {addingForDate && (
        <BlockForm
          defaultDate={addingForDate}
          onClose={() => setAddingForDate(null)}
        />
      )}

      {/* Work/School schedule setup modal */}
      {showWorkForm && (
        <WorkScheduleForm onClose={() => setShowWorkForm(false)} />
      )}

      <div className="p-5 lg:p-10 max-w-4xl mx-auto">
        {/* Page header */}
        <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
          <div>
            <h1 className="font-hand text-3xl" style={{ color: 'var(--color-ink)' }}>
              Week Planner
            </h1>
            <p className="font-body text-sm mt-0.5" style={{ color: 'var(--color-ink-faint)' }}>
              {formatHeaderRange(anchorMonday)}
            </p>
          </div>
          {/* Controls: work schedule + nav */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Work/School schedule button */}
            <button
              onClick={() => setShowWorkForm(true)}
              className="font-body text-xs px-3 py-1.5 rounded-lg"
              style={{
                backgroundColor: 'var(--color-accent-light)',
                border: '1px solid var(--color-accent)',
                color: 'var(--color-accent)',
              }}
            >
              ⚙ Work Schedule
            </button>

            {/* Divider */}
            <div style={{ width: '1px', height: '20px', backgroundColor: 'var(--color-paper-ruled)' }} />

            <button
              onClick={prevWeek}
              className="font-body text-sm px-3 py-1.5 rounded-lg"
              style={{
                backgroundColor: 'var(--color-paper-dark)',
                border: '1px solid var(--color-paper-ruled)',
                color: 'var(--color-ink-faint)',
              }}
              aria-label="Previous week"
            >
              ‹
            </button>
            <button
              onClick={goToday}
              className="font-body text-xs px-3 py-1.5 rounded-lg"
              style={{
                backgroundColor: 'var(--color-paper-dark)',
                border: '1px solid var(--color-paper-ruled)',
                color: 'var(--color-ink-faint)',
              }}
            >
              Today
            </button>
            <button
              onClick={nextWeek}
              className="font-body text-sm px-3 py-1.5 rounded-lg"
              style={{
                backgroundColor: 'var(--color-paper-dark)',
                border: '1px solid var(--color-paper-ruled)',
                color: 'var(--color-ink-faint)',
              }}
              aria-label="Next week"
            >
              ›
            </button>
          </div>
        </div>

        {/* Loading state */}
        {isLoading && (
          <div className="space-y-3">
            {weekDays.map((d) => (
              <div
                key={d}
                className="animate-pulse rounded-lg"
                style={{ height: '72px', backgroundColor: 'var(--color-paper-ruled)' }}
              />
            ))}
          </div>
        )}

        {/* 7-day list */}
        {!isLoading && (
          <div className="space-y-3">
            {weekDays.map((dateStr) => {
              const { weekday, day, month } = formatDay(dateStr);
              const dayBlocks = (byDate[dateStr] ?? []).sort((a, b) =>
                a.startTime.localeCompare(b.startTime)
              );
              const isToday = dateStr === today;

              return (
                <div
                  key={dateStr}
                  className="paper-card overflow-hidden"
                  style={{ borderLeft: isToday ? '4px solid var(--color-accent)' : '4px solid var(--color-paper-ruled)' }}
                >
                  {/* Day header */}
                  <div
                    className="flex items-center justify-between px-4 py-2"
                    style={{ backgroundColor: isToday ? 'rgba(196,113,58,0.06)' : 'var(--color-paper-dark)' }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-center">
                        <p
                          className="font-hand text-xs uppercase"
                          style={{ color: isToday ? 'var(--color-accent)' : 'var(--color-ink-faint)' }}
                        >
                          {weekday}
                        </p>
                        <p
                          className="font-hand text-xl leading-none"
                          style={{ color: isToday ? 'var(--color-accent)' : 'var(--color-ink)' }}
                        >
                          {day}
                        </p>
                        <p className="font-body text-xs" style={{ color: 'var(--color-ink-faint)' }}>
                          {month}
                        </p>
                      </div>
                      {isToday && (
                        <span
                          className="font-body text-xs px-2 py-0.5 rounded-full"
                          style={{ backgroundColor: 'var(--color-accent)', color: '#fff' }}
                        >
                          Today
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => setAddingForDate(dateStr)}
                      className="font-body text-xs px-3 py-1 rounded-md"
                      style={{
                        backgroundColor: 'var(--color-paper)',
                        border: '1px solid var(--color-paper-ruled)',
                        color: 'var(--color-ink-faint)',
                      }}
                    >
                      + Block
                    </button>
                  </div>

                  {/* Blocks */}
                  {dayBlocks.length === 0 ? (
                    <p
                      className="font-body text-xs px-4 py-3"
                      style={{ color: 'var(--color-ink-faint)' }}
                    >
                      No blocks — free day ✦
                    </p>
                  ) : (
                    <div className="divide-y" style={{ borderColor: 'var(--color-paper-ruled)' }}>
                      {dayBlocks.map((block) => (
                        <div key={block.id} className="relative group">
                          <ScheduleBlock block={block} />
                          {/* Delete button, appears on hover */}
                          <button
                            onClick={() => void deleteBlock.mutateAsync(block.id)}
                            className="absolute top-2 right-3 opacity-0 group-hover:opacity-100 font-body text-xs px-2 py-0.5 rounded"
                            style={{
                              backgroundColor: 'var(--color-paper-dark)',
                              color: '#C0392B',
                              border: '1px solid var(--color-paper-ruled)',
                              transition: 'opacity 0.15s',
                            }}
                            aria-label="Delete block"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
