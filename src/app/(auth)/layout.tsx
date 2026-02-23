import type { ReactNode } from 'react';

/**
 * Auth route group layout.
 * Minimal centered layout — no sidebar, no top bar.
 * Shows the paper-textured background with a centered card.
 */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="graph-paper-bg min-h-screen flex flex-col items-center justify-center p-4">
      {/* Paper brand mark */}
      <div className="mb-8 text-center">
        <h1
          className="text-5xl font-bold"
          style={{ fontFamily: 'var(--font-caveat)', color: 'var(--color-ink)' }}
        >
          Habit Journal
        </h1>
        <p
          className="mt-1 text-lg"
          style={{ fontFamily: 'var(--font-body)', color: 'var(--color-ink-light)' }}
        >
          Your AI-powered daily coach
        </p>
      </div>

      {/* Auth card */}
      <div
        className="paper-card w-full max-w-md p-8"
        style={{ boxShadow: 'var(--shadow-card)' }}
      >
        {children}
      </div>

      {/* Footer note */}
      <p
        className="mt-6 text-sm"
        style={{ fontFamily: 'var(--font-body)', color: 'var(--color-ink-faint)' }}
      >
        Building better habits, one day at a time.
      </p>
    </div>
  );
}
