'use client';

import { useState } from 'react';
import { useCreateBlock } from '@/hooks/useSchedule';
import type { CreateScheduleBlockInput } from '@/lib/validations/schedule.schema';

interface BlockFormProps {
  defaultDate?: string; // YYYY-MM-DD
  onClose: () => void;
}

const CATEGORIES: { value: CreateScheduleBlockInput['category']; label: string; emoji: string }[] = [
  { value: 'habit',    label: 'Habit',    emoji: '✦' },
  { value: 'work',     label: 'Work',     emoji: '💼' },
  { value: 'rest',     label: 'Rest',     emoji: '☁️' },
  { value: 'social',   label: 'Social',   emoji: '👥' },
  { value: 'personal', label: 'Personal', emoji: '🌱' },
  { value: 'learning', label: 'Learning', emoji: '📖' },
];

export default function BlockForm({ defaultDate, onClose }: BlockFormProps) {
  const today = new Date().toISOString().slice(0, 10);

  const [title, setTitle]         = useState('');
  const [blockDate, setBlockDate] = useState(defaultDate ?? today);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime]     = useState('10:00');
  const [category, setCategory]   = useState<CreateScheduleBlockInput['category']>('work');
  const [error, setError]         = useState('');

  const createMutation = useCreateBlock();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!title.trim()) { setError('Title is required'); return; }
    if (startTime >= endTime) { setError('End time must be after start time'); return; }

    const payload: CreateScheduleBlockInput = {
      title: title.trim(),
      blockDate,
      startTime,
      endTime,
      category,
      isRecurring: false,
    };

    try {
      await createMutation.mutateAsync(payload);
      onClose();
    } catch {
      setError('Something went wrong. Please try again.');
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(26,26,26,0.4)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="paper-card w-full max-w-md p-6 space-y-5" style={{ maxHeight: '90vh', overflowY: 'auto' }}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="font-hand text-2xl" style={{ color: 'var(--color-ink)' }}>
            New Block
          </h2>
          <button type="button" onClick={onClose} style={{ color: 'var(--color-ink-faint)' }} aria-label="Close">✕</button>
        </div>

        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
          {/* Title */}
          <div>
            <label htmlFor="block-title" className="font-hand text-sm block mb-1" style={{ color: 'var(--color-ink-faint)' }}>
              Title *
            </label>
            <input
              id="block-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Deep work, Morning run, Lunch…"
              maxLength={100}
              autoFocus
              className="w-full font-body text-sm px-3 py-2 rounded-md outline-none"
              style={{
                backgroundColor: 'var(--color-paper-dark)',
                border: '1.5px solid var(--color-paper-ruled)',
                color: 'var(--color-ink)',
              }}
            />
          </div>

          {/* Date */}
          <div>
            <label htmlFor="block-date" className="font-hand text-sm block mb-1" style={{ color: 'var(--color-ink-faint)' }}>
              Date
            </label>
            <input
              id="block-date"
              type="date"
              value={blockDate}
              onChange={(e) => setBlockDate(e.target.value)}
              className="font-body text-sm px-3 py-2 rounded-md outline-none"
              style={{
                backgroundColor: 'var(--color-paper-dark)',
                border: '1.5px solid var(--color-paper-ruled)',
                color: 'var(--color-ink)',
              }}
            />
          </div>

          {/* Time range */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="block-start" className="font-hand text-sm block mb-1" style={{ color: 'var(--color-ink-faint)' }}>
                Start
              </label>
              <input
                id="block-start"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full font-body text-sm px-3 py-2 rounded-md outline-none"
                style={{
                  backgroundColor: 'var(--color-paper-dark)',
                  border: '1.5px solid var(--color-paper-ruled)',
                  color: 'var(--color-ink)',
                }}
              />
            </div>
            <div>
              <label htmlFor="block-end" className="font-hand text-sm block mb-1" style={{ color: 'var(--color-ink-faint)' }}>
                End
              </label>
              <input
                id="block-end"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full font-body text-sm px-3 py-2 rounded-md outline-none"
                style={{
                  backgroundColor: 'var(--color-paper-dark)',
                  border: '1.5px solid var(--color-paper-ruled)',
                  color: 'var(--color-ink)',
                }}
              />
            </div>
          </div>

          {/* Category */}
          <div>
            <span className="font-hand text-sm block mb-2" style={{ color: 'var(--color-ink-faint)' }}>
              Category
            </span>
            <div className="grid grid-cols-3 gap-2">
              {CATEGORIES.map(({ value, label, emoji }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setCategory(value)}
                  className="flex items-center gap-1.5 px-2 py-1.5 rounded-md text-left transition-colors"
                  style={{
                    backgroundColor: category === value ? 'var(--color-accent)' : 'var(--color-paper-dark)',
                    border: `1.5px solid ${category === value ? 'var(--color-accent)' : 'var(--color-paper-ruled)'}`,
                    color: category === value ? '#fff' : 'var(--color-ink-faint)',
                  }}
                >
                  <span>{emoji}</span>
                  <span className="font-body text-xs">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Error */}
          {error && <p className="font-body text-sm" style={{ color: '#C0392B' }}>{error}</p>}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button" onClick={onClose}
              className="flex-1 font-body text-sm py-2 rounded-md"
              style={{
                backgroundColor: 'var(--color-paper-dark)',
                border: '1.5px solid var(--color-paper-ruled)',
                color: 'var(--color-ink-faint)',
              }}
            >Cancel</button>
            <button
              type="submit"
              disabled={createMutation.isPending || !title.trim()}
              className="flex-1 font-body text-sm py-2 rounded-md"
              style={{
                backgroundColor: createMutation.isPending || !title.trim()
                  ? 'var(--color-paper-ruled)'
                  : 'var(--color-accent)',
                color: createMutation.isPending || !title.trim() ? 'var(--color-ink-faint)' : '#ffffff',
                cursor: createMutation.isPending || !title.trim() ? 'not-allowed' : 'pointer',
              }}
            >
              {createMutation.isPending ? 'Adding…' : 'Add Block'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
