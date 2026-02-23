'use client';

import { useEffect, useState } from 'react';

interface MotivationResponse {
  message: string;
  fresh: boolean;
}

/** Typewriter hook — reveals text char-by-char */
function useTypewriter(text: string, active: boolean, speed = 22): string {
  const [displayed, setDisplayed] = useState('');

  useEffect(() => {
    if (!active) { setDisplayed(text); return; }
    setDisplayed('');
    let i = 0;
    const id = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) clearInterval(id);
    }, speed);
    return () => clearInterval(id);
  }, [text, active, speed]);

  return displayed;
}

export default function MotivationCard() {
  const [data, setData]       = useState<MotivationResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/ai/motivation')
      .then((r) => r.json() as Promise<MotivationResponse>)
      .then(setData)
      .catch(() =>
        setData({
          message: 'Every habit you keep is a vote for the person you want to become.',
          fresh: false,
        }),
      )
      .finally(() => setLoading(false));
  }, []);

  const displayed = useTypewriter(
    data?.message ?? '',
    !!data?.fresh,
  );

  if (loading) {
    return (
      <div
        className="paper-card p-5 animate-pulse"
        style={{ minHeight: '88px' }}
      >
        <div
          className="rounded mb-2"
          style={{ height: '12px', width: '40%', backgroundColor: 'var(--color-paper-ruled)' }}
        />
        <div
          className="rounded mb-1.5"
          style={{ height: '10px', width: '90%', backgroundColor: 'var(--color-paper-ruled)' }}
        />
        <div
          className="rounded"
          style={{ height: '10px', width: '70%', backgroundColor: 'var(--color-paper-ruled)' }}
        />
      </div>
    );
  }

  return (
    <div
      className="paper-card p-5 relative overflow-hidden"
      style={{ borderLeft: '4px solid var(--color-accent)' }}
    >
      {/* Decorative quill mark */}
      <span
        className="absolute right-4 top-3 font-hand text-2xl select-none pointer-events-none"
        style={{ color: 'var(--color-paper-ruled)', transform: 'rotate(20deg)' }}
        aria-hidden="true"
      >
        ✦
      </span>

      <p
        className="font-hand text-xs uppercase tracking-widest mb-2"
        style={{ color: 'var(--color-accent)', letterSpacing: '0.12em' }}
      >
        Today's coaching
      </p>

      <p
        className="font-hand text-lg leading-snug"
        style={{ color: 'var(--color-ink)', maxWidth: '92%' }}
      >
        {data?.fresh ? displayed : (data?.message ?? '')}
        {data?.fresh && displayed.length < (data?.message.length ?? 0) && (
          <span
            className="inline-block ml-px align-middle"
            style={{
              width: '2px', height: '1.1em',
              backgroundColor: 'var(--color-accent)',
              animation: 'blink 0.9s step-end infinite',
            }}
            aria-hidden="true"
          />
        )}
      </p>

      <style>{`@keyframes blink { 50% { opacity: 0; } }`}</style>
    </div>
  );
}
