'use client';

import { useState } from 'react';
import { useHabits, useDeleteHabit } from '@/hooks/useHabits';
import HabitForm from './HabitForm';
import type { Habit } from '@/lib/db/schema';

const FREQ_LABELS: Record<string, string> = {
  daily:   'Daily',
  weekly:  'Weekly',
  monthly: 'Monthly',
  custom:  'Custom',
};

export default function HabitList() {
  const { data: habits = [], isLoading } = useHabits();
  const deleteMutation = useDeleteHabit();

  const [mode, setMode]                 = useState<'list' | 'create' | 'edit'>('list');
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [archivingId, setArchivingId]   = useState<string | null>(null);

  const activeHabits   = (habits as Habit[]).filter((h) => !h.archivedAt && h.isActive !== false);
  const archivedHabits = (habits as Habit[]).filter((h) => !!h.archivedAt);

  function openEdit(habit: Habit) {
    setEditingHabit(habit);
    setMode('edit');
  }

  function closeForm() {
    setMode('list');
    setEditingHabit(null);
  }

  async function handleArchive(habit: Habit) {
    if (!confirm(`Archive "${habit.title}"? You can find it below.`)) return;
    setArchivingId(habit.id);
    try {
      await deleteMutation.mutateAsync(habit.id);
    } finally {
      setArchivingId(null);
    }
  }

  return (
    <>
      {/* Modal form */}
      {(mode === 'create' || mode === 'edit') && (
        <HabitForm
          habit={mode === 'edit' ? (editingHabit ?? undefined) : undefined}
          onClose={closeForm}
        />
      )}

      <div className="p-5 lg:p-10 max-w-3xl mx-auto">
        {/* Page header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-hand text-3xl" style={{ color: 'var(--color-ink)' }}>
              My Habits
            </h1>
            <p className="font-body text-sm mt-1" style={{ color: 'var(--color-ink-faint)' }}>
              {activeHabits.length} active habit{activeHabits.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={() => setMode('create')}
            className="font-body text-sm px-4 py-2 rounded-lg"
            style={{
              backgroundColor: 'var(--color-accent)',
              color: '#ffffff',
            }}
          >
            + New Habit
          </button>
        </div>

        {/* Loading skeletons */}
        {isLoading && (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="animate-pulse rounded-lg"
                style={{ height: '72px', backgroundColor: 'var(--color-paper-ruled)' }}
              />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && activeHabits.length === 0 && (
          <div className="paper-card p-10 flex flex-col items-center gap-4 text-center">
            <span className="text-5xl" aria-hidden="true">✦</span>
            <p className="font-hand text-xl" style={{ color: 'var(--color-ink-light)' }}>
              No habits yet
            </p>
            <p className="font-body text-sm" style={{ color: 'var(--color-ink-faint)' }}>
              Start building your routine by adding your first habit.
            </p>
            <button
              onClick={() => setMode('create')}
              className="font-body text-sm px-5 py-2 rounded-lg mt-1"
              style={{ backgroundColor: 'var(--color-accent)', color: '#ffffff' }}
            >
              Add your first habit
            </button>
          </div>
        )}

        {/* Active habits list */}
        {!isLoading && activeHabits.length > 0 && (
          <div className="space-y-3">
            {activeHabits.map((habit) => (
              <div
                key={habit.id}
                className="paper-card p-4 flex items-center gap-4"
                style={{
                  borderLeft: `4px solid ${habit.color ?? 'var(--color-accent)'}`,
                }}
              >
                {/* Icon / initials */}
                <div
                  className="flex-shrink-0 flex items-center justify-center rounded-full font-hand text-lg"
                  style={{
                    width: '40px',
                    height: '40px',
                    backgroundColor: 'var(--color-paper-dark)',
                    color: 'var(--color-accent)',
                  }}
                >
                  {habit.icon ?? habit.title.charAt(0).toUpperCase()}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-hand text-lg" style={{ color: 'var(--color-ink)' }}>
                      {habit.title}
                    </span>
                    {habit.aiGenerated && (
                      <span
                        className="font-body text-xs px-1.5 py-0.5 rounded"
                        style={{
                          backgroundColor: 'var(--color-paper-ruled)',
                          color: 'var(--color-ink-faint)',
                        }}
                      >
                        AI
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span
                      className="font-body text-xs px-2 py-0.5 rounded-full"
                      style={{
                        backgroundColor: 'var(--color-paper-dark)',
                        color: 'var(--color-pencil)',
                      }}
                    >
                      {FREQ_LABELS[habit.frequency] ?? habit.frequency}
                    </span>
                    {habit.reminderTime && (
                      <span className="font-body text-xs" style={{ color: 'var(--color-ink-faint)' }}>
                        ⏰ {habit.reminderTime}
                      </span>
                    )}
                    {habit.description && (
                      <span
                        className="font-body text-xs truncate"
                        style={{ color: 'var(--color-ink-faint)' }}
                      >
                        {habit.description}
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex-shrink-0 flex items-center gap-2">
                  <button
                    onClick={() => openEdit(habit)}
                    className="font-body text-xs px-3 py-1.5 rounded-md"
                    style={{
                      backgroundColor: 'var(--color-paper-dark)',
                      border: '1px solid var(--color-paper-ruled)',
                      color: 'var(--color-ink-faint)',
                    }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => void handleArchive(habit)}
                    disabled={archivingId === habit.id}
                    className="font-body text-xs px-3 py-1.5 rounded-md"
                    style={{
                      backgroundColor: 'var(--color-paper-dark)',
                      border: '1px solid var(--color-paper-ruled)',
                      color: 'var(--color-ink-faint)',
                      opacity: archivingId === habit.id ? 0.5 : 1,
                    }}
                  >
                    Archive
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Archived section */}
        {!isLoading && archivedHabits.length > 0 && (
          <div className="mt-10">
            <h2
              className="font-hand text-lg mb-3"
              style={{ color: 'var(--color-ink-faint)' }}
            >
              Archived ({archivedHabits.length})
            </h2>
            <div className="space-y-2">
              {archivedHabits.map((habit) => (
                <div
                  key={habit.id}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg"
                  style={{
                    backgroundColor: 'var(--color-paper-dark)',
                    opacity: 0.65,
                  }}
                >
                  <span
                    className="font-hand text-base line-through"
                    style={{ color: 'var(--color-ink-faint)' }}
                  >
                    {habit.title}
                  </span>
                  <span
                    className="font-body text-xs"
                    style={{ color: 'var(--color-ink-faint)' }}
                  >
                    {FREQ_LABELS[habit.frequency] ?? habit.frequency}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
