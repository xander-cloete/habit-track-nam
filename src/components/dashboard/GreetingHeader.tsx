'use client';

interface GreetingHeaderProps {
  displayName: string;
  date: string; // YYYY-MM-DD
}

function getGreeting(hour: number): string {
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

function formatDate(dateStr: string): string {
  const d = new Date(`${dateStr}T00:00:00`);
  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export default function GreetingHeader({ displayName, date }: GreetingHeaderProps) {
  const greeting = getGreeting(new Date().getHours());

  return (
    <header className="mb-2">
      <p className="font-body text-sm mb-1" style={{ color: 'var(--color-ink-faint)' }}>
        {formatDate(date)}
      </p>
      <h1 className="font-hand text-5xl leading-tight" style={{ color: 'var(--color-ink)' }}>
        {greeting}, {displayName} ✏️
      </h1>
      <p className="font-body text-lg mt-1" style={{ color: 'var(--color-ink-light)' }}>
        Your journal is ready. Let&apos;s make today count.
      </p>
    </header>
  );
}
