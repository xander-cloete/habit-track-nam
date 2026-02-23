'use client';

import { useState } from 'react';
import { useGoals } from '@/hooks/useGoals';
import GoalCard from './GoalCard';
import GoalForm from './GoalForm';
import type { Goal } from '@/lib/db/schema';

type Timeframe = 'yearly' | 'monthly' | 'weekly' | 'daily';

const TABS: { value: Timeframe; label: string; icon: string }[] = [
  { value: 'yearly',  label: 'Yearly',  icon: '🌟' },
  { value: 'monthly', label: 'Monthly', icon: '📅' },
  { value: 'weekly',  label: 'Weekly',  icon: '📋' },
  { value: 'daily',   label: 'Daily',   icon: '✦'  },
];

const TF_DESCRIPTIONS: Record<Timeframe, string> = {
  yearly:  'Big-picture vision & year-long commitments',
  monthly: '30-day milestones that move the needle',
  weekly:  "This week's top priorities",
  daily:   "Today's intentions & micro-wins",
};

export default function GoalTree() {
  const [activeTab, setActiveTab]       = useState<Timeframe>('monthly');
  const [formMode, setFormMode]         = useState<'none' | 'create' | 'edit'>('none');
  const [editingGoal, setEditingGoal]   = useState<Goal | null>(null);

  const { data: goals = [], isLoading } = useGoals(activeTab);
  const activeGoals   = (goals as Goal[]).filter((g) => g.status !== 'archived');
  const archivedGoals = (goals as Goal[]).filter((g) => g.status === 'archived');

  function openEdit(goal: Goal) {
    setEditingGoal(goal);
    setFormMode('edit');
  }

  function closeForm() {
    setFormMode('none');
    setEditingGoal(null);
  }

  const currentTab = TABS.find((t) => t.value === activeTab)!;

  return (
    <>
      {/* Modal form */}
      {formMode !== 'none' && (
        <GoalForm
          goal={formMode === 'edit' ? (editingGoal ?? undefined) : undefined}
          defaultTimeframe={activeTab}
          onClose={closeForm}
        />
      )}

      <div className="p-5 lg:p-10 max-w-3xl mx-auto">
        {/* Page header */}
        <div className="mb-8">
          <h1 className="font-hand text-3xl" style={{ color: 'var(--color-ink)' }}>
            Goals
          </h1>
          <p className="font-body text-sm mt-1" style={{ color: 'var(--color-ink-faint)' }}>
            Organised by horizon — from vision to daily intention
          </p>
        </div>

        {/* Timeframe tabs */}
        <div
          className="flex gap-1 p-1 rounded-xl mb-6"
          style={{ backgroundColor: 'var(--color-paper-dark)' }}
        >
          {TABS.map(({ value, label, icon }) => (
            <button
              key={value}
              onClick={() => setActiveTab(value)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg font-body text-sm transition-colors"
              style={{
                backgroundColor: activeTab === value ? 'var(--color-paper)' : 'transparent',
                color: activeTab === value ? 'var(--color-ink)' : 'var(--color-ink-faint)',
                boxShadow: activeTab === value ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              }}
            >
              <span>{icon}</span>
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>

        {/* Tab description + add button */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="font-hand text-xl" style={{ color: 'var(--color-ink)' }}>
              {currentTab.icon} {currentTab.label} Goals
            </h2>
            <p className="font-body text-xs mt-0.5" style={{ color: 'var(--color-ink-faint)' }}>
              {TF_DESCRIPTIONS[activeTab]}
            </p>
          </div>
          <button
            onClick={() => setFormMode('create')}
            className="font-body text-sm px-4 py-2 rounded-lg flex-shrink-0"
            style={{ backgroundColor: 'var(--color-accent)', color: '#ffffff' }}
          >
            + Add
          </button>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="animate-pulse rounded-lg"
                style={{ height: '96px', backgroundColor: 'var(--color-paper-ruled)' }}
              />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && activeGoals.length === 0 && (
          <div className="paper-card p-10 flex flex-col items-center gap-4 text-center">
            <span className="text-4xl">{currentTab.icon}</span>
            <p className="font-hand text-xl" style={{ color: 'var(--color-ink-light)' }}>
              No {currentTab.label.toLowerCase()} goals yet
            </p>
            <p className="font-body text-sm" style={{ color: 'var(--color-ink-faint)' }}>
              {TF_DESCRIPTIONS[activeTab]}. Add one to start tracking.
            </p>
            <button
              onClick={() => setFormMode('create')}
              className="font-body text-sm px-5 py-2 rounded-lg"
              style={{ backgroundColor: 'var(--color-accent)', color: '#ffffff' }}
            >
              Add {currentTab.label} Goal
            </button>
          </div>
        )}

        {/* Goals list */}
        {!isLoading && activeGoals.length > 0 && (
          <div className="space-y-3">
            {activeGoals.map((goal) => (
              <GoalCard key={goal.id} goal={goal} onEdit={() => openEdit(goal)} />
            ))}
          </div>
        )}

        {/* Archived */}
        {!isLoading && archivedGoals.length > 0 && (
          <div className="mt-10">
            <h3 className="font-hand text-base mb-3" style={{ color: 'var(--color-ink-faint)' }}>
              Archived ({archivedGoals.length})
            </h3>
            <div className="space-y-2">
              {archivedGoals.map((goal) => (
                <div
                  key={goal.id}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg"
                  style={{ backgroundColor: 'var(--color-paper-dark)', opacity: 0.6 }}
                >
                  <span className="font-hand text-base line-through" style={{ color: 'var(--color-ink-faint)' }}>
                    {goal.title}
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
