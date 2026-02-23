'use client';

import { useState, useEffect } from 'react';
import { useOnboardingStore } from '@/stores/onboardingStore';

export default function Step1Welcome() {
  const { data, nextStep, updateData } = useOnboardingStore();

  const [displayName, setDisplayName] = useState<string>(data.displayName ?? '');
  const [timezone, setTimezone]       = useState<string>(data.timezone   ?? '');

  useEffect(() => {
    const detected = Intl.DateTimeFormat().resolvedOptions().timeZone;
    setTimezone(data.timezone && data.timezone.length > 0 ? data.timezone : detected);
  }, [data.timezone]);

  const isValid = displayName.trim().length > 0;

  function handleContinue() {
    if (!isValid) return;
    updateData({ displayName: displayName.trim(), timezone });
    nextStep();
  }

  return (
    <div
      className="flex flex-col min-h-screen items-center justify-center px-6 py-12"
      style={{ backgroundColor: '#FDF8F0' }}
    >
      <div className="w-full max-w-lg flex flex-col gap-8">

        {/* Heading */}
        <div className="flex flex-col gap-3 text-center">
          <h1
            className="font-hand text-4xl leading-tight"
            style={{ color: '#1A1A1A' }}
          >
            Hello, let&apos;s build your perfect day ✨
          </h1>
          <p className="font-body text-base leading-relaxed" style={{ color: '#8B7355' }}>
            We&apos;ll create a personalized habit journal tailored to your life,
            your rhythms, and your goals. This takes about 3 minutes.
          </p>
        </div>

        {/* Card */}
        <div
          className="flex flex-col gap-6 rounded-2xl p-8 shadow-sm border"
          style={{ backgroundColor: '#FFFCF7', borderColor: '#E8DCC8' }}
        >
          <p
            className="font-body text-sm font-semibold uppercase tracking-widest"
            style={{ color: '#C4713A' }}
          >
            Step 1 — Let&apos;s meet you
          </p>

          {/* Name input */}
          <div className="flex flex-col gap-2">
            <label
              htmlFor="displayName"
              className="font-body text-sm font-semibold"
              style={{ color: '#1A1A1A' }}
            >
              Your name
            </label>
            <input
              id="displayName"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              maxLength={50}
              placeholder="What should I call you?"
              className="rounded-xl px-4 py-3 font-body text-base outline-none border transition-all duration-200"
              style={{
                backgroundColor: '#FDF8F0',
                color: '#1A1A1A',
                borderColor: displayName.trim().length > 0 ? '#C4713A' : '#D4C4A8',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#C4713A';
                e.currentTarget.style.boxShadow   = '0 0 0 3px rgba(196,113,58,0.15)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.boxShadow  = 'none';
                e.currentTarget.style.borderColor =
                  displayName.trim().length > 0 ? '#C4713A' : '#D4C4A8';
              }}
              autoFocus
            />
            <p className="font-body text-xs text-right" style={{ color: '#8B7355' }}>
              {displayName.length} / 50
            </p>
          </div>

          {/* Timezone chip */}
          <div className="flex flex-col gap-2">
            <label className="font-body text-sm font-semibold" style={{ color: '#1A1A1A' }}>
              Timezone
            </label>
            <div
              className="inline-flex items-center gap-2 self-start rounded-full px-4 py-2 font-body text-sm border"
              style={{ backgroundColor: '#F0E8D8', borderColor: '#D4C4A8', color: '#8B7355' }}
            >
              <span>🌍</span>
              <span>{timezone}</span>
              <span style={{ color: '#B8A88A' }}>— you can change this later</span>
            </div>
          </div>

          {displayName.trim().length > 0 && (
            <p className="font-hand text-xl text-center" style={{ color: '#C4713A' }}>
              Nice to meet you, {displayName.trim()}!
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end">
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