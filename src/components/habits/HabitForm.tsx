'use client';

import { useState } from 'react';
import { useCreateHabit, useUpdateHabit } from '@/hooks/useHabits';
import type { Habit } from '@/lib/db/schema';
import type { CreateHabitInput } from '@/lib/validations/habit.schema';

interface HabitFormProps {
  habit?: Habit;           // present → edit mode
  onClose: () => void;
}

const FREQUENCIES = [
  { value: 'daily',   label: 'Daily' },
  { value: 'weekly',  label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
] as const;

export default function HabitForm({ habit, onClose }: HabitFormProps) {
  const isEdit = !!habit;

  const [title, setTitle]               = useState(habit?.title ?? '');
  const [description, setDescription]   = useState(habit?.description ?? '');
  const [frequency, setFrequency]       = useState<CreateHabitInput['frequency']>(
    (habit?.frequency as CreateHabitInput['frequency']) ?? 'daily',
  );
  const [reminderTime, setReminderTime] = useState(habit?.reminderTime ?? '');
  const [error, setError]               = useState('');

  const createMutation = useCreateHabit();
  const updateMutation = useUpdateHabit(habit?.id ?? '');
  const isPending = createMutation.isPending || updateMutation.isPending;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    const payload: CreateHabitInput = {
      title: title.trim(),
      frequency,
      targetCount: 1,
      ...(description.trim() && { description: description.trim() }),
      ...(reminderTime && { reminderTime }),
    };

    try {
      if (isEdit) {
        await updateMutation.mutateAsync(payload);
      } else {
        await createMutation.mutateAsync(payload);
      }
      onClose();
    } catch {
      setError('Something went wrong. Please try again.');
    }
  }

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(26,26,26,0.4)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="paper-card w-full max-w-md p-6 space-y-5"
        style={{ maxHeight: '90vh', overflowY: 'auto' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2
            className="font-hand text-2xl"
            style={{ color: 'var(--color-ink)' }}
          >
            {isEdit ? 'Edit Habit' : 'New Habit'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="font-body text-lg leading-none"
            style={{ color: 'var(--color-ink-faint)', lineHeight: 1 }}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
          {/* Title */}
          <div>
            <label
              htmlFor="habit-title"
              className="font-hand text-sm block mb-1"
              style={{ color: 'var(--color-ink-faint)' }}
            >
              Title *
            </label>
            <input
              id="habit-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Morning run, Read 20 pages…"
              maxLength={100}
              className="w-full font-body text-sm px-3 py-2 rounded-md outline-none"
              style={{
                backgroundColor: 'var(--color-paper-dark)',
                border: '1.5px solid var(--color-paper-ruled)',
                color: 'var(--color-ink)',
              }}
              autoFocus
            />
          </div>

          {/* Frequency */}
          <div>
            <span
              className="font-hand text-sm block mb-2"
              style={{ color: 'var(--color-ink-faint)' }}
            >
              Frequency
            </span>
            <div className="flex gap-2 flex-wrap">
              {FREQUENCIES.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setFrequency(value)}
                  className="font-body text-sm px-3 py-1.5 rounded-full transition-colors"
                  style={{
                    backgroundColor:
                      frequency === value
                        ? 'var(--color-accent)'
                        : 'var(--color-paper-dark)',
                    color:
                      frequency === value
                        ? '#ffffff'
                        : 'var(--color-ink-faint)',
                    border:
                      frequency === value
                        ? '1.5px solid var(--color-accent)'
                        : '1.5px solid var(--color-paper-ruled)',
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label
              htmlFor="habit-desc"
              className="font-hand text-sm block mb-1"
              style={{ color: 'var(--color-ink-faint)' }}
            >
              Description (optional)
            </label>
            <textarea
              id="habit-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Why this habit matters…"
              rows={2}
              maxLength={500}
              className="w-full font-body text-sm px-3 py-2 rounded-md outline-none resize-none"
              style={{
                backgroundColor: 'var(--color-paper-dark)',
                border: '1.5px solid var(--color-paper-ruled)',
                color: 'var(--color-ink)',
              }}
            />
          </div>

          {/* Reminder time */}
          <div>
            <label
              htmlFor="habit-reminder"
              className="font-hand text-sm block mb-1"
              style={{ color: 'var(--color-ink-faint)' }}
            >
              Reminder time (optional)
            </label>
            <input
              id="habit-reminder"
              type="time"
              value={reminderTime}
              onChange={(e) => setReminderTime(e.target.value)}
              className="font-body text-sm px-3 py-2 rounded-md outline-none"
              style={{
                backgroundColor: 'var(--color-paper-dark)',
                border: '1.5px solid var(--color-paper-ruled)',
                color: 'var(--color-ink)',
              }}
            />
          </div>

          {/* Error */}
          {error && (
            <p className="font-body text-sm" style={{ color: '#C0392B' }}>
              {error}
            </p>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="flex-1 font-body text-sm py-2 rounded-md"
              style={{
                backgroundColor: 'var(--color-paper-dark)',
                border: '1.5px solid var(--color-paper-ruled)',
                color: 'var(--color-ink-faint)',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending || !title.trim()}
              className="flex-1 font-body text-sm py-2 rounded-md"
              style={{
                backgroundColor: isPending || !title.trim()
                  ? 'var(--color-paper-ruled)'
                  : 'var(--color-accent)',
                color: isPending || !title.trim() ? 'var(--color-ink-faint)' : '#ffffff',
                cursor: isPending || !title.trim() ? 'not-allowed' : 'pointer',
              }}
            >
              {isPending ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Habit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
