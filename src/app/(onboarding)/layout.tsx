import type { ReactNode } from 'react';

export default function OnboardingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="graph-paper-bg min-h-screen flex flex-col">
      {/* Progress bar area (populated in Phase 3) */}
      <header
        className="border-b px-6 py-4 flex items-center justify-between"
        style={{
          background: 'var(--color-paper-dark)',
          borderColor: 'var(--color-paper-ruled)',
        }}
      >
        <h1
          className="text-2xl font-bold"
          style={{ fontFamily: 'var(--font-caveat)', color: 'var(--color-ink)' }}
        >
          Habit Journal
        </h1>
        <span
          className="text-sm"
          style={{ fontFamily: 'var(--font-body)', color: 'var(--color-ink-faint)' }}
        >
          Setting up your journal…
        </span>
      </header>
      <main className="flex-1 flex items-center justify-center p-6">
        {children}
      </main>
    </div>
  );
}
