'use client';

import { useState, KeyboardEvent } from 'react';
import { useOnboardingStore } from '@/stores/onboardingStore';

const SUGGESTIONS: string[] = [
  'Morning walk',
  'Drink water',
  'Read before bed',
  'Journaling',
  'Meditation',
  'Exercise',
  'Healthy eating',
  '8 hours sleep',
];

const MAX_HABITS = 20;

export default function Step3CurrentHabits() {
  const { data, nextStep, prevStep, updateData } = useOnboardingStore();

  const [habits, setHabits] = useState<string[]>(data.currentHabits ?? []);
  const [inputVal, setInputVal] = useState<string>('');

  function addHabit(raw: string) {
    const trimmed = raw.trim();
    if (!trimmed || habits.includes(trimmed) || habits.length >= MAX_HABITS) return;
    setHabits((prev) => [...prev, trimmed]);
    setInputVal('');
  }

  function removeHabit(habit: string) {
    setHabits((prev) => prev.filter((h) => h !== habit));
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addHabit(inputVal);
    }
  }

  function addSuggestion(s: string) {
    addHabit(s);
  }

  function handleContinue() {
    updateData({ currentHabits: habits });
    nextStep();
  }

  return (
    <div className="flex flex-col min-h-screen items-center justify-center px-6 py-12" style={{ backgroundColor: '#FDF8F0' }}>
      <div className="w-full max-w-xl flex flex-col gap-8">
        <div className="flex flex-col gap-2 text-center">
          <h1 className="font-hand text-4xl leading-tight" style={{ color: '#1A1A1A' }}>
            Current Habits — What do you already do? 💫
          </h1>
          <p className="font-body text-base" style={{ color: '#8B7355' }}>
            Add habits you already practise.
            <span style={{ color: '#B8A88A' }}> (optional)</span>
          </p>
        </div>

        <div className="flex flex-col gap-5 rounded-2xl p-6 border" style={{ backgroundColor: '#FFFCF7', borderColor: '#E8DCC8' }}>
          <p className="font-body text-sm font-semibold uppercase tracking-widest" style={{ color: '#C4713A' }}>
            Step 3 — Your current habits
          </p>
          <div className="flex flex-col gap-2">
            <input
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="e.g. Morning coffee, Evening walk..."
              disabled={habits.length >= MAX_HABITS}
              className="rounded-xl px-4 py-3 font-body text-base outline-none border transition-all duration-200"
              style={{ backgroundColor: '#FDF8F0', color: '#1A1A1A', borderColor: '#D4C4A8' }}
              onFocus={(e) => { e.currentTarget.style.borderColor = '#C4713A'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(196,113,58,0.15)'; }}
              onBlur={(e) => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = '#D4C4A8'; }}
            />
            <p className="font-body text-xs text-right" style={{ color: '#8B7355' }}>
              {habits.length} / {MAX_HABITS} — press Enter or comma to add
            </p>
          </div>
          {habits.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {habits.map((habit) => (
                <span key={habit}
                  className="inline-flex items-center gap-1 rounded-full px-3 py-1 font-body text-sm font-semibold"
                  style={{ backgroundColor: '#F0E8D8', color: '#1A1A1A', border: '1px solid #D4C4A8' }}
                >
                  {habit}
                  <button
                    onClick={() => removeHabit(habit)}
                    className="ml-1 rounded-full w-4 h-4 inline-flex items-center justify-center text-xs font-bold"
                    style={{ backgroundColor: '#C4713A', color: '#FFFCF7' }}
                    aria-label={'Remove ' + habit}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}

          <div className="flex flex-col gap-2">
            <p className="font-body text-xs font-semibold uppercase tracking-widest" style={{ color: '#8B7355' }}>
              Quick add
            </p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.map((s) => {
                const already = habits.includes(s);
                const full    = habits.length >= MAX_HABITS;
                return (
                  <button
                    key={s}
                    onClick={() => addSuggestion(s)}
                    disabled={already || full}
                    className="rounded-full px-3 py-1 font-body text-sm border transition-all duration-150"
                    style={{
                      backgroundColor: already ? '#E0D8C8' : '#F5EFE3',
                      borderColor: already ? '#C4713A' : '#D4C4A8',
                      color: already || full ? '#B8A88A' : '#1A1A1A',
                      cursor: already || full ? 'not-allowed' : 'pointer',
                      opacity: full && !already ? 0.5 : 1,
                    }}
                  >
                    {already ? '✓ ' : '+ '}{s}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center">
          <button
            onClick={prevStep}
            className="rounded-xl px-6 py-3 font-hand text-xl font-semibold border transition-all duration-200"
            style={{ backgroundColor: 'transparent', borderColor: '#D4C4A8', color: '#8B7355' }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#F0E8D8'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
          >
            ← Back
          </button>
          <button
            onClick={handleContinue}
            className="rounded-xl px-8 py-3 font-hand text-xl font-semibold transition-all duration-200"
            style={{ backgroundColor: '#C4713A', color: '#FFFCF7', boxShadow: '0 4px 14px rgba(196,113,58,0.3)' }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#B5612A'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#C4713A'; }}
          >
            Continue →
          </button>
        </div>
      </div>
    </div>
  );
}
