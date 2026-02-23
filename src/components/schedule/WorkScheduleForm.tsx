'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

// ── Types ──────────────────────────────────────────────────────────────────────
type ScheduleType = 'Work' | 'School';

interface WorkSchedulePayload {
  type: ScheduleType;
  days: number[];          // 0=Mon, 1=Tue, ... 6=Sun (matching JS getDay offset)
  startTime: string;       // HH:MM
  endTime: string;         // HH:MM
  commuteStart?: string;
  commuteEnd?: string;
}

// ── Constants ──────────────────────────────────────────────────────────────────
const WEEK_DAYS = [
  { label: 'Mon', value: 0 },
  { label: 'Tue', value: 1 },
  { label: 'Wed', value: 2 },
  { label: 'Thu', value: 3 },
  { label: 'Fri', value: 4 },
  { label: 'Sat', value: 5 },
  { label: 'Sun', value: 6 },
];

const DEFAULT_DAYS = [0, 1, 2, 3, 4]; // Mon–Fri

// ── Component ──────────────────────────────────────────────────────────────────
export default function WorkScheduleForm({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();

  const [scheduleType, setScheduleType] = useState<ScheduleType>('Work');
  const [selectedDays, setSelectedDays] = useState<number[]>(DEFAULT_DAYS);
  const [startTime, setStartTime]       = useState('09:00');
  const [endTime, setEndTime]           = useState('17:00');
  const [addCommute, setAddCommute]     = useState(false);
  const [commuteStart, setCommuteStart] = useState('08:15');
  const [commuteEnd, setCommuteEnd]     = useState('08:45');

  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState('');
  const [success, setSuccess] = useState('');

  function toggleDay(val: number) {
    setSelectedDays((prev) =>
      prev.includes(val) ? prev.filter((d) => d !== val) : [...prev, val]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (selectedDays.length === 0) {
      setError('Please select at least one day.');
      return;
    }
    if (startTime >= endTime) {
      setError('End time must be after start time.');
      return;
    }
    if (addCommute && commuteStart && commuteEnd && commuteStart >= commuteEnd) {
      setError('Commute end time must be after commute start time.');
      return;
    }

    setSaving(true);
    const payload: WorkSchedulePayload = {
      type: scheduleType,
      days: selectedDays,
      startTime,
      endTime,
      ...(addCommute && commuteStart && commuteEnd
        ? { commuteStart, commuteEnd }
        : {}),
    };

    try {
      const res = await fetch('/api/schedule/work-setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json() as { error?: string };
        throw new Error(data.error ?? 'Failed to save schedule');
      }

      const data = await res.json() as { created: number };
      setSuccess(`Done! Created ${data.created} block${data.created !== 1 ? 's' : ''} over the next 4 weeks.`);

      // Invalidate schedule queries so WeekPlanner refreshes
      await qc.invalidateQueries({ queryKey: ['schedule'] });

      setTimeout(onClose, 1800);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setSaving(false);
    }
  }

  return (
    /* ── Backdrop ── */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(26,26,26,0.45)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* ── Modal card ── */}
      <div
        className="w-full max-w-md rounded-2xl shadow-xl overflow-y-auto"
        style={{
          backgroundColor: 'var(--color-paper)',
          border: '1px solid var(--color-paper-ruled)',
          maxHeight: '90vh',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: '1px solid var(--color-paper-ruled)' }}
        >
          <h2 className="font-hand text-2xl" style={{ color: 'var(--color-ink)' }}>
            Set Up Schedule
          </h2>
          <button
            onClick={onClose}
            className="font-body text-lg px-2 py-1 rounded hover:opacity-70"
            style={{ color: 'var(--color-ink-faint)' }}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Form */}
        <form onSubmit={(e) => void handleSubmit(e)} className="px-6 py-5 flex flex-col gap-5">

          {/* Schedule type toggle */}
          <div className="flex flex-col gap-2">
            <label className="font-body text-sm font-semibold" style={{ color: 'var(--color-ink-faint)' }}>
              Type
            </label>
            <div className="flex rounded-xl overflow-hidden" style={{ border: '1px solid var(--color-paper-ruled)' }}>
              {(['Work', 'School'] as ScheduleType[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setScheduleType(t)}
                  className="flex-1 font-hand text-lg py-2.5 transition-colors"
                  style={{
                    backgroundColor: scheduleType === t ? 'var(--color-accent)' : 'var(--color-paper-dark)',
                    color: scheduleType === t ? '#ffffff' : 'var(--color-ink-faint)',
                  }}
                >
                  {t === 'Work' ? '💼 Work' : '🎓 School'}
                </button>
              ))}
            </div>
          </div>

          {/* Active days */}
          <div className="flex flex-col gap-2">
            <label className="font-body text-sm font-semibold" style={{ color: 'var(--color-ink-faint)' }}>
              Days
            </label>
            <div className="flex gap-2 flex-wrap">
              {WEEK_DAYS.map(({ label, value }) => {
                const active = selectedDays.includes(value);
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => toggleDay(value)}
                    className="font-hand text-base px-3 py-1.5 rounded-lg transition-colors"
                    style={{
                      backgroundColor: active ? 'var(--color-accent-light)' : 'var(--color-paper-dark)',
                      color: active ? 'var(--color-accent)' : 'var(--color-ink-faint)',
                      border: active ? '1px solid var(--color-accent)' : '1px solid var(--color-paper-ruled)',
                    }}
                    aria-pressed={active}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Time range */}
          <div className="flex gap-4">
            <div className="flex flex-col gap-1 flex-1">
              <label className="font-body text-sm font-semibold" style={{ color: 'var(--color-ink-faint)' }}>
                Start time
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
                className="rounded-xl px-4 py-3 font-body text-base outline-none border"
                style={{
                  backgroundColor: 'var(--color-paper-dark)',
                  color: 'var(--color-ink)',
                  borderColor: 'var(--color-paper-ruled)',
                }}
              />
            </div>
            <div className="flex flex-col gap-1 flex-1">
              <label className="font-body text-sm font-semibold" style={{ color: 'var(--color-ink-faint)' }}>
                End time
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
                className="rounded-xl px-4 py-3 font-body text-base outline-none border"
                style={{
                  backgroundColor: 'var(--color-paper-dark)',
                  color: 'var(--color-ink)',
                  borderColor: 'var(--color-paper-ruled)',
                }}
              />
            </div>
          </div>

          {/* Commute toggle */}
          <div className="flex flex-col gap-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={addCommute}
                onChange={(e) => setAddCommute(e.target.checked)}
                className="w-4 h-4 rounded"
                style={{ accentColor: 'var(--color-accent)' }}
              />
              <span className="font-body text-sm font-semibold" style={{ color: 'var(--color-ink-faint)' }}>
                Add commute blocks
              </span>
            </label>

            {addCommute && (
              <div className="flex gap-4 pl-7">
                <div className="flex flex-col gap-1 flex-1">
                  <label className="font-body text-xs" style={{ color: 'var(--color-ink-faint)' }}>
                    Commute start
                  </label>
                  <input
                    type="time"
                    value={commuteStart}
                    onChange={(e) => setCommuteStart(e.target.value)}
                    className="rounded-xl px-3 py-2 font-body text-sm outline-none border"
                    style={{
                      backgroundColor: 'var(--color-paper-dark)',
                      color: 'var(--color-ink)',
                      borderColor: 'var(--color-paper-ruled)',
                    }}
                  />
                </div>
                <div className="flex flex-col gap-1 flex-1">
                  <label className="font-body text-xs" style={{ color: 'var(--color-ink-faint)' }}>
                    Commute end
                  </label>
                  <input
                    type="time"
                    value={commuteEnd}
                    onChange={(e) => setCommuteEnd(e.target.value)}
                    className="rounded-xl px-3 py-2 font-body text-sm outline-none border"
                    style={{
                      backgroundColor: 'var(--color-paper-dark)',
                      color: 'var(--color-ink)',
                      borderColor: 'var(--color-paper-ruled)',
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Info note */}
          <p className="font-body text-xs leading-relaxed" style={{ color: 'var(--color-ink-faint)' }}>
            This will add blocks to your planner for the <strong>next 28 days</strong>.
            Any existing work/school blocks in that window will be replaced.
          </p>

          {/* Error / success messages */}
          {error && (
            <p className="font-body text-sm" style={{ color: '#B91C1C' }}>{error}</p>
          )}
          {success && (
            <p className="font-body text-sm" style={{ color: 'var(--color-accent-green)' }}>✓ {success}</p>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 font-hand text-lg py-2.5 rounded-xl transition-opacity hover:opacity-70"
              style={{
                backgroundColor: 'var(--color-paper-dark)',
                color: 'var(--color-ink-faint)',
                border: '1px solid var(--color-paper-ruled)',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-[2] font-hand text-lg py-2.5 rounded-xl transition-opacity"
              style={{
                backgroundColor: 'var(--color-accent)',
                color: '#ffffff',
                opacity: saving ? 0.6 : 1,
              }}
            >
              {saving ? 'Saving…' : `Add ${scheduleType} Schedule`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
