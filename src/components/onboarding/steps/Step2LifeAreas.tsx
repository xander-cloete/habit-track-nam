'use client';

import { useState, useEffect } from 'react';
import { useOnboardingStore } from '@/stores/onboardingStore';

interface LifeArea {
  name: string;
  icon: string;
  currentPct: number;
  targetPct: number;
}

interface Preset {
  name: string;
  icon: string;
  color: string;
}

const PRESETS: Preset[] = [
  { name: 'Health & Fitness',     icon: '💪', color: '#5A7A4A' },
  { name: 'Career & Work',        icon: '💼', color: '#4A6A8A' },
  { name: 'Relationships',        icon: '❤️',  color: '#C45A5A' },
  { name: 'Learning & Growth',    icon: '📚', color: '#7A5A9A' },
  { name: 'Finances',             icon: '💰', color: '#8A7A2A' },
  { name: 'Creativity',           icon: '🎨', color: '#C4713A' },
  { name: 'Health & Mindfulness', icon: '🧘', color: '#5A9A8A' },
  { name: 'Fun & Social',         icon: '🎉', color: '#9A5A7A' },
];

const MAX_SELECTED = 6;

const DEFAULT_SELECTED: LifeArea[] = [
  { name: 'Health & Fitness',  icon: '💪', currentPct: 20, targetPct: 30 },
  { name: 'Career & Work',     icon: '💼', currentPct: 20, targetPct: 30 },
  { name: 'Learning & Growth', icon: '📚', currentPct: 20, targetPct: 30 },
];

function presetColor(name: string): string {
  return PRESETS.find((p) => p.name === name)?.color ?? '#C4713A';
}

export default function Step2LifeAreas() {
  const { data, nextStep, prevStep, updateData } = useOnboardingStore();

  const [selected, setSelected] = useState<LifeArea[]>(() => {
    if (data.lifeAreas && data.lifeAreas.length > 0) return data.lifeAreas;
    return DEFAULT_SELECTED;
  });

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (data.lifeAreas && data.lifeAreas.length > 0) setSelected(data.lifeAreas);
  }, []);

  function isChosen(name: string): boolean {
    return selected.some((a) => a.name === name);
  }

  function toggleArea(preset: Preset) {
    if (isChosen(preset.name)) {
      setSelected((prev) => prev.filter((a) => a.name !== preset.name));
    } else {
      if (selected.length >= MAX_SELECTED) return;
      setSelected((prev) => [
        ...prev,
        { name: preset.name, icon: preset.icon, currentPct: 20, targetPct: 30 },
      ]);
    }
  }

  function updatePct(
    name: string,
    field: 'currentPct' | 'targetPct',
    value: number,
  ) {
    setSelected((prev) =>
      prev.map((a) => (a.name === name ? { ...a, [field]: value } : a)),
    );
  }

  function handleContinue() {
    if (selected.length === 0) return;
    updateData({ lifeAreas: selected });
    nextStep();
  }

  const isValid = selected.length > 0;
  const atMax  = selected.length >= MAX_SELECTED;

  return (
    <div
      className="flex flex-col min-h-screen items-center justify-center px-6 py-12"
      style={{ backgroundColor: '#FDF8F0' }}
    >
      <div className="w-full max-w-2xl flex flex-col gap-8">

        {/* Heading */}
        <div className="flex flex-col gap-3 text-center">
          <h1 className="font-hand text-4xl leading-tight" style={{ color: '#1A1A1A' }}>
            Life Areas — What matters to you? 🗺️
          </h1>
          <p className="font-body text-base" style={{ color: '#8B7355' }}>
            Select the areas of life you want to track and improve.
          </p>
          <div
            className="inline-flex items-center gap-2 self-center rounded-full px-4 py-1 font-body text-sm font-semibold border"
            style={{
              backgroundColor: atMax ? '#F0E8D8' : '#FDF8F0',
              borderColor:     atMax ? '#C4713A' : '#D4C4A8',
              color:           atMax ? '#C4713A' : '#8B7355',
            }}
          >
            {selected.length} of {MAX_SELECTED} selected
            {atMax && <span>&nbsp;— max reached</span>}
          </div>
        </div>

        {/* Preset chips */}
        <div className="flex flex-wrap gap-3 justify-center">
          {PRESETS.map((preset) => {
            const active   = isChosen(preset.name);
            const disabled = !active && atMax;
            return (
              <button
                key={preset.name}
                onClick={() => toggleArea(preset)}
                disabled={disabled}
                className="flex items-center gap-2 rounded-full px-4 py-2 font-body text-sm font-semibold border transition-all duration-200"
                style={{
                  backgroundColor: active   ? preset.color : '#F5EFE3',
                  borderColor:     active   ? preset.color : '#D4C4A8',
                  color:           active   ? '#FFFCF7' : disabled ? '#B8A88A' : '#1A1A1A',
                  cursor:    disabled ? 'not-allowed' : 'pointer',
                  opacity:   disabled ? 0.5 : 1,
                  boxShadow: active ? ('0 2px 8px ' + preset.color + '55') : 'none',
                  transform: active ? 'scale(1.04)' : 'scale(1)',
                }}
              >
                <span>{preset.icon}</span>
                <span>{preset.name}</span>
                {active && <span className="ml-1 text-xs">✓</span>}
              </button>
            );
          })}
        </div>

        {selected.length > 0 && (
          <div className="flex flex-col gap-4">
            <p
              className="font-body text-sm font-semibold uppercase tracking-widest text-center"
              style={{ color: '#C4713A' }}
            >
              Adjust your time allocation
            </p>
            {selected.map((area) => {
              const color = presetColor(area.name);
              const gradC = 'linear-gradient(to right, ' + color + ' ' + area.currentPct + '%, #E8DCC8 ' + area.currentPct + '%)';
              const gradT = 'linear-gradient(to right, ' + color + '99 ' + area.targetPct + '%, #E8DCC8 ' + area.targetPct + '%)';
              return (
                <div key={area.name}
                  className="rounded-2xl p-5 border flex flex-col gap-4"
                  style={{ backgroundColor: '#FFFCF7', borderColor: '#E8DCC8' }}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{area.icon}</span>
                    <span className="font-hand text-xl font-semibold" style={{ color: '#1A1A1A' }}>
                      {area.name}
                    </span>
                  </div>

                  {/* Currently spending slider */}
                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between font-body text-xs" style={{ color: '#8B7355' }}>
                      <span>Currently spending</span>
                      <span className="font-semibold" style={{ color }}>{area.currentPct}%</span>
                    </div>
                    <input type="range" min={0} max={100} step={5}
                      value={area.currentPct}
                      onChange={(e) => updatePct(area.name, 'currentPct', Number(e.target.value))}
                      className="w-full h-2 rounded-full appearance-none cursor-pointer"
                      style={{ accentColor: color, background: gradC }}
                    />
                  </div>

                  {/* Target slider */}
                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between font-body text-xs" style={{ color: '#8B7355' }}>
                      <span>Target</span>
                      <span className="font-semibold" style={{ color }}>{area.targetPct}%</span>
                    </div>
                    <input type="range" min={0} max={100} step={5}
                      value={area.targetPct}
                      onChange={(e) => updatePct(area.name, 'targetPct', Number(e.target.value))}
                      className="w-full h-2 rounded-full appearance-none cursor-pointer"
                      style={{ accentColor: color + '99', background: gradT }}
                    />
                  </div>

                  {area.targetPct !== area.currentPct && (
                    <p className="font-body text-xs" style={{ color: '#8B7355' }}>
                      {area.targetPct > area.currentPct
                        ? '+' + (area.targetPct - area.currentPct) + '% growth goal'
                        : (area.currentPct - area.targetPct) + '% reduction goal'}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Actions */}
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
            disabled={!isValid}
            className="rounded-xl px-8 py-3 font-hand text-xl font-semibold transition-all duration-200"
            style={{
              backgroundColor: isValid ? '#C4713A' : '#D4C4A8',
              color:           isValid ? '#FFFCF7' : '#8B7355',
              cursor:    isValid ? 'pointer' : 'not-allowed',
              boxShadow: isValid ? '0 4px 14px rgba(196,113,58,0.3)' : 'none',
            }}
            onMouseEnter={(e) => { if (isValid) e.currentTarget.style.backgroundColor = '#B5612A'; }}
            onMouseLeave={(e) => { if (isValid) e.currentTarget.style.backgroundColor = '#C4713A'; }}
          >
            Continue →
          </button>
        </div>
      </div>
    </div>
  );
}
