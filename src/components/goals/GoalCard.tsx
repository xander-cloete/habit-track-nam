'use client';

import { useState } from 'react';
import { useUpdateGoal, useDeleteGoal } from '@/hooks/useGoals';
import type { Goal } from '@/lib/db/schema';

// Timeframe → accent colour (left border)
const TF_COLORS: Record<string, string> = {
  yearly:  '#9B72CF', // purple
  monthly: '#4A90D9', // blue
  weekly:  '#27AE60', // green
  daily:   '#C4713A', // accent/orange
};

const TF_LABELS: Record<string, string> = {
  yearly: 'Year', monthly: 'Month', weekly: 'Week', daily: 'Day',
};

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  active:    { bg: 'var(--color-paper-dark)', text: 'var(--color-ink-faint)', label: 'Active' },
  completed: { bg: '#D5F5E3',               text: '#1E8449',                 label: '✓ Done'  },
  paused:    { bg: '#FEF9E7',               text: '#B7950B',                 label: 'Paused'  },
  archived:  { bg: 'var(--color-paper-dark)', text: 'var(--color-ink-faint)', label: 'Archived' },
};

interface GoalCardProps {
  goal: Goal;
  onEdit: () => void;
}

export default function GoalCard({ goal, onEdit }: GoalCardProps) {
  const [menuOpen, setMenuOpen]   = useState(false);
  const updateMutation = useUpdateGoal(goal.id);
  const deleteMutation = useDeleteGoal();
  const accentColor    = TF_COLORS[goal.timeframe] ?? 'var(--color-accent)';
  const statusStyle    = STATUS_STYLES[goal.status] ?? STATUS_STYLES.active;

  async function handleComplete() {
    await updateMutation.mutateAsync({ status: 'completed', progressPct: 100 });
  }

  async function handleDelete() {
    if (!confirm(`Archive "${goal.title}"?`)) return;
    await deleteMutation.mutateAsync(goal.id);
  }

  const isActive    = goal.status === 'active';
  const isCompleted = goal.status === 'completed';

  return (
    <div
      className="paper-card p-4 relative"
      style={{ borderLeft: `4px solid ${accentColor}` }}
    >
      {/* Top row */}
      <div className="flex items-start gap-3">
        {/* Timeframe chip */}
        <span
          className="font-body text-xs px-2 py-0.5 rounded-full flex-shrink-0 mt-0.5"
          style={{ backgroundColor: `${accentColor}22`, color: accentColor, border: `1px solid ${accentColor}55` }}
        >
          {TF_LABELS[goal.timeframe] ?? goal.timeframe}
        </span>

        {/* Title + description */}
        <div className="flex-1 min-w-0">
          <p
            className="font-hand text-lg leading-snug"
            style={{
              color: 'var(--color-ink)',
              textDecoration: isCompleted ? 'line-through' : 'none',
              opacity: isCompleted ? 0.6 : 1,
            }}
          >
            {goal.title}
          </p>
          {goal.description && (
            <p
              className="font-body text-xs mt-0.5 line-clamp-2"
              style={{ color: 'var(--color-ink-faint)' }}
            >
              {goal.description}
            </p>
          )}
        </div>

        {/* Status badge + kebab */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <span
            className="font-body text-xs px-2 py-0.5 rounded-full"
            style={{ backgroundColor: statusStyle.bg, color: statusStyle.text }}
          >
            {statusStyle.label}
          </span>
          <div className="relative">
            <button
              onClick={() => setMenuOpen((o) => !o)}
              className="font-body text-sm px-1.5 py-0.5 rounded"
              style={{ color: 'var(--color-ink-faint)' }}
              aria-label="Goal options"
            >
              ···
            </button>
            {menuOpen && (
              <div
                className="absolute right-0 top-full mt-1 rounded-lg shadow-lg z-10 overflow-hidden"
                style={{ backgroundColor: 'var(--color-paper)', border: '1px solid var(--color-paper-ruled)', minWidth: '120px' }}
                onMouseLeave={() => setMenuOpen(false)}
              >
                <button
                  onClick={() => { setMenuOpen(false); onEdit(); }}
                  className="w-full text-left font-body text-sm px-3 py-2 hover:bg-[var(--color-paper-dark)]"
                  style={{ color: 'var(--color-ink)' }}
                >
                  Edit
                </button>
                {isActive && (
                  <button
                    onClick={() => { setMenuOpen(false); void handleComplete(); }}
                    className="w-full text-left font-body text-sm px-3 py-2 hover:bg-[var(--color-paper-dark)]"
                    style={{ color: '#27AE60' }}
                  >
                    Mark Complete
                  </button>
                )}
                <button
                  onClick={() => { setMenuOpen(false); void handleDelete(); }}
                  className="w-full text-left font-body text-sm px-3 py-2 hover:bg-[var(--color-paper-dark)]"
                  style={{ color: '#C0392B' }}
                >
                  Archive
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mt-3">
        <div className="flex items-center justify-between mb-1">
          <span className="font-body text-xs" style={{ color: 'var(--color-ink-faint)' }}>
            Progress
          </span>
          <span className="font-hand text-xs" style={{ color: accentColor }}>
            {goal.progressPct}%
          </span>
        </div>
        <div
          className="progress-track"
          style={{ height: '5px' }}
        >
          <div
            className="progress-fill"
            style={{
              width: `${goal.progressPct}%`,
              backgroundColor: accentColor,
              transition: 'width 0.4s ease',
            }}
          />
        </div>
      </div>

      {/* Target date */}
      {goal.targetDate && (
        <p className="font-body text-xs mt-2" style={{ color: 'var(--color-ink-faint)' }}>
          📅 Due {new Date(goal.targetDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </p>
      )}

      {/* AI badge */}
      {goal.aiGenerated && (
        <span
          className="absolute bottom-3 right-4 font-body text-xs px-1.5 py-0.5 rounded"
          style={{ backgroundColor: 'var(--color-paper-ruled)', color: 'var(--color-ink-faint)' }}
        >
          AI
        </span>
      )}
    </div>
  );
}
