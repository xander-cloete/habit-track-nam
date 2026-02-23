'use client';

import { useState } from 'react';
import { useOnboardingStore } from '@/stores/onboardingStore';

const MAX_GOALS = 4;

export default function Step7WeeklyGoals() {
  const { data, nextStep, prevStep, updateData } = useOnboardingStore();

  const [goals, setGoals] = useState<string[]>(() => {
    const prefilled = (data.weeklyGoals ?? []).filter((g) => g.trim() !== '');
    return prefilled.length > 0 ? prefilled : [''];
  });

  const handleChange = (index: number, value: string) => {
    setGoals((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  const handleAdd = () => {
    if (goals.length < MAX_GOALS) {
      setGoals((prev) => [...prev, '']);
    }
  };

  const handleRemove = (index: number) => {
    setGoals((prev) => prev.filter((_, i) => i !== index));
  };

  const handleContinue = () => {
    const filtered = goals.map((g) => g.trim()).filter((g) => g !== '');
    updateData({ weeklyGoals: filtered });
    nextStep();
  };

  const handleBack = () => {
    const filtered = goals.map((g) => g.trim()).filter((g) => g !== '');
    updateData({ weeklyGoals: filtered });
    prevStep();
  };

  return (
    <div
      className="flex flex-col min-h-screen px-6 py-10"
      style={{ backgroundColor: '#FDF8F0', color: '#1A1A1A' }}
    >
      {/* Header */}
      <div className="mb-8">
        <p
          className="text-sm font-body mb-1"
          style={{ color: '#8B7355' }}
        >
          Step 7 of 9
        </p>
        <h1
          className="text-4xl font-hand mb-1"
          style={{ color: '#1A1A1A' }}
        >
          This Week
        </h1>
        <p
          className="text-lg font-hand"
          style={{ color: '#C4713A' }}
        >
          What's your focus?{' '}
          <span
            className="text-sm font-body"
            style={{ color: '#8B7355' }}
          >
            (optional)
          </span>
        </p>
      </div>

      {/* Hint */}
      <p
        className="font-body text-sm mb-6 italic"
        style={{ color: '#8B7355' }}
      >
        What 3 things, if done, would make this week a win?
      </p>

      {/* Goal Fields */}
      <div className="flex flex-col gap-3 mb-4">
        {goals.map((goal, index) => (
          <div key={index} className="flex items-center gap-2">
            <span
              className="font-hand text-lg w-6 shrink-0 text-center"
              style={{ color: '#C4713A' }}
            >
              {index + 1}.
            </span>

            <input
              type="text"
              value={goal}
              onChange={(e) => handleChange(index, e.target.value)}
              placeholder={
                index === 0
                  ? 'e.g. Finish project report, Exercise 3 times...'
                  : `Focus ${index + 1}...`
              }
              className="flex-1 rounded-xl px-4 py-3 font-body text-sm outline-none transition-all"
              style={{
                backgroundColor: '#FAF3E8',
                border: '1.5px solid #D9C9B0',
                color: '#1A1A1A',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#C4713A';
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(196,113,58,0.12)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = '#D9C9B0';
                e.currentTarget.style.boxShadow = 'none';
              }}
            />

            {goals.length > 1 && (
              <button
                onClick={() => handleRemove(index)}
                className="shrink-0 w-7 h-7 flex items-center justify-center rounded-full transition-opacity hover:opacity-70"
                style={{
                  backgroundColor: '#EDE0CC',
                  color: '#8B7355',
                  fontSize: '1rem',
                  lineHeight: 1,
                }}
                aria-label="Remove goal"
              >
                ×
              </button>
            )}
          </div>
        ))}
      </div>

      {goals.length < MAX_GOALS && (
        <button
          onClick={handleAdd}
          className="self-start font-body text-sm transition-opacity hover:opacity-70 mb-2"
          style={{ color: '#C4713A' }}
        >
          + Add another focus
        </button>
      )}

      {goals.length === MAX_GOALS && (
        <p
          className="font-body text-xs mb-2"
          style={{ color: '#8B7355' }}
        >
          Maximum of {MAX_GOALS} goals reached.
        </p>
      )}

      <div className="flex-1" />

      {/* Navigation */}
      <div className="flex gap-3 mt-8">
        <button
          onClick={handleBack}
          className="flex-1 py-3 rounded-2xl font-hand text-lg transition-opacity hover:opacity-70"
          style={{
            backgroundColor: '#EDE0CC',
            color: '#8B7355',
          }}
        >
          Back
        </button>
        <button
          onClick={handleContinue}
          className="flex-1 py-3 rounded-2xl font-hand text-lg transition-opacity hover:opacity-80"
          style={{
            backgroundColor: '#C4713A',
            color: '#FDF8F0',
          }}
        >
          Continue
        </button>
      </div>
    </div>
  );
}
