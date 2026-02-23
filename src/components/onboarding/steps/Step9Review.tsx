'use client';

import { useState } from 'react';
import { useOnboardingStore } from '@/stores/onboardingStore';

type MotivationStyle = 'gentle' | 'balanced' | 'direct';

interface CoachingOption {
  value: MotivationStyle;
  emoji: string;
  label: string;
  description: string;
}

const COACHING_OPTIONS: CoachingOption[] = [
  {
    value: 'gentle',
    emoji: '🌱',
    label: 'Gentle',
    description: "Encouraging and patient. I’ll celebrate every win and never judge.",
  },
  {
    value: 'balanced',
    emoji: '⚖️',
    label: 'Balanced',
    description: "Honest and supportive. I’ll push you just enough.",
  },
  {
    value: 'direct',
    emoji: '🎯',
    label: 'Direct',
    description: "No-nonsense accountability. I’ll tell it like it is.",
  },
];

export default function Step9Review() {
  const { data, nextStep, prevStep, updateData } = useOnboardingStore();

  const [selected, setSelected] = useState<MotivationStyle>(
    data.motivationStyle ?? 'balanced'
  );

  const handleGenerate = () => {
    updateData({ motivationStyle: selected });
    nextStep();
  };

  const handleBack = () => {
    updateData({ motivationStyle: selected });
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
          Step 9 of 9
        </p>
        <h1
          className="text-4xl font-hand mb-1"
          style={{ color: '#1A1A1A' }}
        >
          Almost There
        </h1>
        <p
          className="text-lg font-hand"
          style={{ color: '#C4713A' }}
        >
          Choose your coaching style
        </p>
      </div>

      {/* Coaching Style Cards */}
      <div className="flex flex-col gap-3 mb-8">
        {COACHING_OPTIONS.map((option) => {
          const isSelected = selected === option.value;
          return (
            <button
              key={option.value}
              onClick={() => setSelected(option.value)}
              className="flex items-start gap-4 rounded-2xl px-5 py-4 text-left transition-all"
              style={{
                backgroundColor: isSelected ? '#FAE8D4' : '#FAF3E8',
                border: isSelected
                  ? '2px solid #C4713A'
                  : '2px solid #D9C9B0',
                boxShadow: isSelected
                  ? '0 0 0 3px rgba(196,113,58,0.15)'
                  : 'none',
              }}
            >
              {/* Radio dot */}
              <div
                className="mt-1 shrink-0 w-5 h-5 rounded-full flex items-center justify-center"
                style={{
                  border: isSelected
                    ? '2px solid #C4713A'
                    : '2px solid #8B7355',
                  backgroundColor: isSelected ? '#C4713A' : 'transparent',
                }}
              >
                {isSelected && (
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: '#FDF8F0' }}
                  />
                )}
              </div>

              <div className="flex-1">
                <p
                  className="font-hand text-xl mb-0.5"
                  style={{ color: isSelected ? '#C4713A' : '#1A1A1A' }}
                >
                  {option.emoji} {option.label}
                </p>
                <p
                  className="font-body text-sm"
                  style={{ color: '#8B7355' }}
                >
                  {option.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Divider */}
      <div
        className="w-full h-px mb-6"
        style={{ backgroundColor: '#D9C9B0' }}
      />

      {/* Summary Review */}
      <div className="mb-8">
        <h2
          className="font-hand text-2xl mb-4"
          style={{ color: '#1A1A1A' }}
        >
          Your Summary
        </h2>

        <div className="flex flex-col gap-3">
          {/* Identity */}
          <SummaryRow label="Name">
            <span className="font-body text-sm" style={{ color: '#1A1A1A' }}>
              {data.displayName || '—'}
            </span>
          </SummaryRow>

          <SummaryRow label="Timezone">
            <span className="font-body text-sm" style={{ color: '#1A1A1A' }}>
              {data.timezone || '—'}
            </span>
          </SummaryRow>

          <SummaryRow label="Schedule">
            <span className="font-body text-sm" style={{ color: '#1A1A1A' }}>
              {data.wakeTime && data.sleepTime
                ? `Wake ${data.wakeTime} · Sleep ${data.sleepTime}`
                : '—'}
            </span>
          </SummaryRow>

          {/* Life Areas */}
          {(data.lifeAreas ?? []).length > 0 && (
            <SummaryRow label="Life Areas">
              <div className="flex flex-wrap gap-1.5">
                {(data.lifeAreas ?? []).map((area) => (
                  <span
                    key={area.name}
                    className="rounded-full px-3 py-0.5 font-body text-xs"
                    style={{
                      backgroundColor: '#EDE0CC',
                      color: '#1A1A1A',
                    }}
                  >
                    {area.icon} {area.name}
                  </span>
                ))}
              </div>
            </SummaryRow>
          )}

          {/* Current Habits */}
          <SummaryRow label="Current Habits">
            <span className="font-body text-sm" style={{ color: '#1A1A1A' }}>
              {(data.currentHabits ?? []).length > 0
                ? `${(data.currentHabits ?? []).length} habit${(data.currentHabits ?? []).length === 1 ? '' : 's'} listed`
                : 'None listed'}
            </span>
          </SummaryRow>

          {/* Goals */}
          {(data.yearlyGoals ?? [])[0] && (
            <SummaryRow label="Yearly Goal">
              <span className="font-body text-sm" style={{ color: '#1A1A1A' }}>
                {(data.yearlyGoals ?? [])[0]}
              </span>
            </SummaryRow>
          )}

          {(data.monthlyGoals ?? [])[0] && (
            <SummaryRow label="Monthly Goal">
              <span className="font-body text-sm" style={{ color: '#1A1A1A' }}>
                {(data.monthlyGoals ?? [])[0]}
              </span>
            </SummaryRow>
          )}

          {(data.weeklyGoals ?? [])[0] && (
            <SummaryRow label="Weekly Focus">
              <span className="font-body text-sm" style={{ color: '#1A1A1A' }}>
                {(data.weeklyGoals ?? [])[0]}
              </span>
            </SummaryRow>
          )}

          {(data.dailyGoals ?? [])[0] && (
            <SummaryRow label="Daily Must-Do">
              <span className="font-body text-sm" style={{ color: '#1A1A1A' }}>
                {(data.dailyGoals ?? [])[0]}
              </span>
            </SummaryRow>
          )}

          {/* Coaching Style */}
          <SummaryRow label="Coaching Style">
            <span className="font-body text-sm" style={{ color: '#C4713A' }}>
              {COACHING_OPTIONS.find((o) => o.value === selected)?.emoji}{' '}
              {COACHING_OPTIONS.find((o) => o.value === selected)?.label}
            </span>
          </SummaryRow>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex gap-3 mt-auto">
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
          onClick={handleGenerate}
          className="flex-[2] py-3 rounded-2xl font-hand text-lg transition-opacity hover:opacity-80"
          style={{
            backgroundColor: '#C4713A',
            color: '#FDF8F0',
          }}
        >
          Generate My Plan ✨
        </button>
      </div>
    </div>
  );
}

/* ---------- Helper ---------- */

interface SummaryRowProps {
  label: string;
  children: React.ReactNode;
}

function SummaryRow({ label, children }: SummaryRowProps) {
  return (
    <div
      className="flex flex-col gap-0.5 rounded-xl px-4 py-3"
      style={{ backgroundColor: '#FAF3E8' }}
    >
      <p
        className="font-body text-xs uppercase tracking-wide"
        style={{ color: '#8B7355' }}
      >
        {label}
      </p>
      {children}
    </div>
  );
}
