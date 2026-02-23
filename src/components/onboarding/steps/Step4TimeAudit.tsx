'use client';

import { useState } from 'react';
import { useOnboardingStore } from '@/stores/onboardingStore';

function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

function minutesToHours(min: number): number {
  return Math.round((min / 60) * 10) / 10;
}

function computeDayHours(wake: string, sleep: string): number {
  const wakeMin  = timeToMinutes(wake);
  const sleepMin = timeToMinutes(sleep);
  const diff = sleepMin >= wakeMin ? sleepMin - wakeMin : (24 * 60 - wakeMin) + sleepMin;
  return minutesToHours(diff);
}

export default function Step4TimeAudit() {
  const { data, nextStep, prevStep, updateData } = useOnboardingStore();

  const [wakeTime,  setWakeTime]  = useState<string>(data.wakeTime  ?? '07:00');
  const [sleepTime, setSleepTime] = useState<string>(data.sleepTime ?? '23:00');

  const dayHours = computeDayHours(wakeTime, sleepTime);

  function handleContinue() {
    updateData({ wakeTime, sleepTime });
    nextStep();
  }

  return (
    <div className="flex flex-col min-h-screen items-center justify-center px-6 py-12" style={{ backgroundColor: '#FDF8F0' }}>
      <div className="w-full max-w-lg flex flex-col gap-8">

        {/* Heading */}
        <div className="flex flex-col gap-2 text-center">
          <h1 className="font-hand text-4xl leading-tight" style={{ color: '#1A1A1A' }}>
            Your Day — When do you wake and sleep? ☀️
          </h1>
          <p className="font-body text-base" style={{ color: '#8B7355' }}>
            Tell us your typical schedule so we can find the best time for your habits.
          </p>
        </div>

        {/* Card */}
        <div className="flex flex-col gap-6 rounded-2xl p-8 border" style={{ backgroundColor: '#FFFCF7', borderColor: '#E8DCC8' }}>
          <p className="font-body text-sm font-semibold uppercase tracking-widest" style={{ color: '#C4713A' }}>
            Step 4 — Your daily schedule
          </p>

          {/* Time pickers */}
          <div className="grid grid-cols-2 gap-4">

            {/* Wake time */}
            <div className="flex flex-col gap-2">
              <label className="font-body text-sm font-semibold" style={{ color: '#1A1A1A' }}>
                ☀️ Wake time
              </label>
              <input
                type="time"
                value={wakeTime}
                onChange={(e) => setWakeTime(e.target.value)}
                required
                className="rounded-xl px-4 py-3 font-hand text-lg outline-none border transition-all duration-200 w-full"
                style={{ backgroundColor: '#FDF8F0', color: '#1A1A1A', borderColor: '#D4C4A8' }}
                onFocus={(e) => { e.currentTarget.style.borderColor = '#C4713A'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(196,113,58,0.15)'; }}
                onBlur={(e) => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = '#D4C4A8'; }}
              />
            </div>

            {/* Sleep time */}
            <div className="flex flex-col gap-2">
              <label className="font-body text-sm font-semibold" style={{ color: '#1A1A1A' }}>
                🌙 Sleep time
              </label>
              <input
                type="time"
                value={sleepTime}
                onChange={(e) => setSleepTime(e.target.value)}
                required
                className="rounded-xl px-4 py-3 font-hand text-lg outline-none border transition-all duration-200 w-full"
                style={{ backgroundColor: '#FDF8F0', color: '#1A1A1A', borderColor: '#D4C4A8' }}
                onFocus={(e) => { e.currentTarget.style.borderColor = '#C4713A'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(196,113,58,0.15)'; }}
                onBlur={(e) => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = '#D4C4A8'; }}
              />
            </div>
          </div>

          {/* Day hours stat */}
          <div className="rounded-xl p-4 text-center" style={{ backgroundColor: '#F0E8D8', border: '1px solid #D4C4A8' }}>
            <p className="font-hand text-2xl" style={{ color: '#C4713A' }}>
              You have {dayHours} hours in your day
            </p>
            <p className="font-body text-sm mt-1" style={{ color: '#8B7355' }}>
              {wakeTime} → {sleepTime}
            </p>
          </div>

          {/* Visual timeline */}
          <div className="flex flex-col gap-2">
            <p className="font-body text-xs font-semibold uppercase tracking-widest" style={{ color: '#8B7355' }}>
              Your day at a glance
            </p>
            <div className="relative h-8 rounded-full overflow-hidden flex" style={{ backgroundColor: '#E8DCC8' }}>
              {(() => {
                const totalMin = (() => {
                  const w = timeToMinutes(wakeTime);
                  const s = timeToMinutes(sleepTime);
                  return s >= w ? s - w : (24 * 60 - w) + s;
                })();
                if (totalMin === 0) return null;
                const wMin = timeToMinutes(wakeTime);
                const segments = [
                  { label: 'Morning',   color: '#C4913A',  startH: 5,  endH: 12  },
                  { label: 'Afternoon', color: '#4A7AAA', startH: 12, endH: 17  },
                  { label: 'Evening',   color: '#7A5A9A', startH: 17, endH: 21  },
                  { label: 'Night',     color: '#2A2A4A', startH: 21, endH: 29  },
                ];
                return segments.map((seg) => {
                  const segStart = seg.startH * 60;
                  const segEnd   = seg.endH   * 60;
                  const sMin = timeToMinutes(sleepTime);
                  const sMax = sMin >= wMin ? sMin : sMin + 24 * 60;
                  const wEnd = wMin + totalMin;
                  const overlapStart = Math.max(segStart, wMin);
                  const overlapEnd   = Math.min(segEnd, wEnd);
                  const overlap = Math.max(0, overlapEnd - overlapStart);
                  const pct = (overlap / totalMin) * 100;
                  if (pct <= 0) return null;
                  return (
                    <div
                      key={seg.label}
                      title={seg.label}
                      style={{ width: pct + '%', backgroundColor: seg.color }}
                      className="h-full flex items-center justify-center"
                    >
                      {pct > 8 && (
                        <span className="font-body text-xs font-semibold" style={{ color: 'rgba(255,255,255,0.9)' }}>
                          {seg.label}
                        </span>
                      )}
                    </div>
                  );
                });
              })()
              }
            </div>
            {/* Legend */}
            <div className="flex justify-between font-body text-xs" style={{ color: '#8B7355' }}>
              <span>{wakeTime}</span>
              <span>{sleepTime}</span>
            </div>
          </div>
        </div>

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
