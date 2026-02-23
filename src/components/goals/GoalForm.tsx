'use client';

import { useState } from 'react';
import { useCreateGoal, useUpdateGoal } from '@/hooks/useGoals';
import type { Goal } from '@/lib/db/schema';
import type { CreateGoalInput } from '@/lib/validations/goal.schema';

interface GoalFormProps {
  goal?: Goal;
  defaultTimeframe?: CreateGoalInput['timeframe'];
  onClose: () => void;
}

const TIMEFRAMES = [
  { value: 'yearly',  label: 'Yearly',  hint: 'Big-picture vision' },
  { value: 'monthly', label: 'Monthly', hint: '30-day milestones' },
  { value: 'weekly',  label: 'Weekly',  hint: "This week's focus" },
  { value: 'daily',   label: 'Daily',   hint: "Today's intention" },
] as const;

export default function GoalForm({ goal, defaultTimeframe = 'monthly', onClose }: GoalFormProps) {
  const isEdit = !!goal;

  const [title, setTitle]           = useState(goal?.title ?? '');
  const [description, setDescription] = useState(goal?.description ?? '');
  const [timeframe, setTimeframe]   = useState<CreateGoalInput['timeframe']>(
    (goal?.timeframe as CreateGoalInput['timeframe']) ?? defaultTimeframe,
  );
  const [targetDate, setTargetDate] = useState(goal?.targetDate ?? '');
  const [error, setError]           = useState('');

  const createMutation = useCreateGoal();
  const updateMutation = useUpdateGoal(goal?.id ?? '');
  const isPending      = createMutation.isPending || updateMutation.isPending;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!title.trim()) { setError('Title is required'); return; }

    const payload: CreateGoalInput = {
      title: title.trim(),
      timeframe,
      ...(description.trim() && { description: description.trim() }),
      ...(targetDate && { targetDate }),
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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(26,26,26,0.4)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="paper-card w-full max-w-md p-6 space-y-5" style={{ maxHeight: '90vh', overflowY: 'auto' }}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="font-hand text-2xl" style={{ color: 'var(--color-ink)' }}>
            {isEdit ? 'Edit Goal' : 'New Goal'}
          </h2>
          <button
            type="button" onClick={onClose}
            className="font-body text-lg"
            style={{ color: 'var(--color-ink-faint)' }}
            aria-label="Close"
          >✕</button>
        </div>

        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
          {/* Timeframe */}
          <div>
            <span className="font-hand text-sm block mb-2" style={{ color: 'var(--color-ink-faint)' }}>
              Timeframe
            </span>
            <div className="grid grid-cols-2 gap-2">
              {TIMEFRAMES.map(({ value, label, hint }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setTimeframe(value)}
                  className="text-left px-3 py-2 rounded-md transition-colors"
                  style={{
                    backgroundColor: timeframe === value ? 'var(--color-accent)' : 'var(--color-paper-dark)',
                    border: `1.5px solid ${timeframe === value ? 'var(--color-accent)' : 'var(--color-paper-ruled)'}`,
                  }}
                >
                  <p className="font-hand text-sm" style={{ color: timeframe === value ? '#fff' : 'var(--color-ink)' }}>
                    {label}
                  </p>
                  <p className="font-body text-xs" style={{ color: timeframe === value ? 'rgba(255,255,255,0.8)' : 'var(--color-ink-faint)' }}>
                    {hint}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label htmlFor="goal-title" className="font-hand text-sm block mb-1" style={{ color: 'var(--color-ink-faint)' }}>
              Goal *
            </label>
            <input
              id="goal-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What do you want to achieve?"
              maxLength={200}
              autoFocus
              className="w-full font-body text-sm px-3 py-2 rounded-md outline-none"
              style={{
                backgroundColor: 'var(--color-paper-dark)',
                border: '1.5px solid var(--color-paper-ruled)',
                color: 'var(--color-ink)',
              }}
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="goal-desc" className="font-hand text-sm block mb-1" style={{ color: 'var(--color-ink-faint)' }}>
              Why this goal? (optional)
            </label>
            <textarea
              id="goal-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Your motivation, context, success criteria…"
              rows={2}
              maxLength={1000}
              className="w-full font-body text-sm px-3 py-2 rounded-md outline-none resize-none"
              style={{
                backgroundColor: 'var(--color-paper-dark)',
                border: '1.5px solid var(--color-paper-ruled)',
                color: 'var(--color-ink)',
              }}
            />
          </div>

          {/* Target date */}
          <div>
            <label htmlFor="goal-date" className="font-hand text-sm block mb-1" style={{ color: 'var(--color-ink-faint)' }}>
              Target date (optional)
            </label>
            <input
              id="goal-date"
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="font-body text-sm px-3 py-2 rounded-md outline-none"
              style={{
                backgroundColor: 'var(--color-paper-dark)',
                border: '1.5px solid var(--color-paper-ruled)',
                color: 'var(--color-ink)',
              }}
            />
          </div>

          {/* Error */}
          {error && <p className="font-body text-sm" style={{ color: '#C0392B' }}>{error}</p>}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button" onClick={onClose} disabled={isPending}
              className="flex-1 font-body text-sm py-2 rounded-md"
              style={{
                backgroundColor: 'var(--color-paper-dark)',
                border: '1.5px solid var(--color-paper-ruled)',
                color: 'var(--color-ink-faint)',
              }}
            >Cancel</button>
            <button
              type="submit"
              disabled={isPending || !title.trim()}
              className="flex-1 font-body text-sm py-2 rounded-md"
              style={{
                backgroundColor: isPending || !title.trim() ? 'var(--color-paper-ruled)' : 'var(--color-accent)',
                color: isPending || !title.trim() ? 'var(--color-ink-faint)' : '#ffffff',
                cursor: isPending || !title.trim() ? 'not-allowed' : 'pointer',
              }}
            >
              {isPending ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Goal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
