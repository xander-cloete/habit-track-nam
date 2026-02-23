'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

interface SidebarProps {
  displayName: string;
  email: string;
}

const navItems = [
  { href: '/dashboard', icon: '📋', label: 'Today'   },
  { href: '/habits',    icon: '✕',  label: 'Habits'  },
  { href: '/planner',   icon: '🕐', label: 'Planner' },
  { href: '/goals',     icon: '🎯', label: 'Goals'   },
  { href: '/journal',   icon: '📓', label: 'Journal' },
  { href: '/coach',     icon: '💬', label: 'Coach'   },
  { href: '/reports',   icon: '📊', label: 'Reports' },
  { href: '/profile',   icon: '👤', label: 'Profile' },
];

export default function Sidebar({ displayName, email }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();

  const firstLetter = displayName.charAt(0).toUpperCase();

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push('/login');
  }

  return (
    <>
      {/* ── Desktop sidebar ──────────────────────────────────────────────── */}
      <aside
        className="hidden lg:flex flex-col h-screen sticky top-0 flex-shrink-0"
        style={{
          width: '256px',
          backgroundColor: 'var(--color-paper)',
          borderRight: '1px solid var(--color-paper-ruled)',
        }}
      >
        {/* Logo */}
        <div className="px-6 pt-6 pb-4">
          <div className="font-hand text-2xl" style={{ color: 'var(--color-accent)' }}>
            ✏️ Habit Journal
          </div>
          <div className="font-body text-sm mt-0.5" style={{ color: 'var(--color-ink-faint)' }}>
            your daily coach
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-2 flex flex-col gap-0.5">
          {navItems.map(({ href, icon, label }) => {
            const isActive = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-3 px-4 py-2.5 rounded-md transition-all"
                style={{
                  borderLeft: isActive
                    ? '3px solid var(--color-accent)'
                    : '3px solid transparent',
                  backgroundColor: isActive ? 'rgba(240,217,200,0.4)' : 'transparent',
                  color: isActive ? 'var(--color-accent)' : 'var(--color-ink)',
                  textDecoration: 'none',
                }}
              >
                <span className="text-xl leading-none">{icon}</span>
                <span className="font-hand text-lg">{label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User info card */}
        <div
          className="mx-3 mb-4 p-3 rounded-lg"
          style={{
            backgroundColor: 'var(--color-paper-dark)',
            border: '1px solid var(--color-paper-ruled)',
          }}
        >
          <div className="flex items-center gap-3 mb-2">
            {/* Avatar circle */}
            <div
              className="flex-shrink-0 flex items-center justify-center rounded-full font-hand text-base"
              style={{
                width: '36px',
                height: '36px',
                backgroundColor: 'var(--color-accent)',
                color: '#ffffff',
              }}
            >
              {firstLetter}
            </div>
            <div className="min-w-0 flex-1">
              <div
                className="font-hand text-sm truncate"
                style={{ color: 'var(--color-ink)' }}
                title={displayName}
              >
                {displayName}
              </div>
              <div
                className="font-body text-xs truncate"
                style={{ color: 'var(--color-ink-faint)' }}
                title={email}
              >
                {email}
              </div>
            </div>
          </div>
          <button
            onClick={() => void handleSignOut()}
            className="w-full font-body text-xs py-1.5 px-3 rounded-md transition-colors"
            style={{
              color: 'var(--color-ink-light)',
              backgroundColor: 'var(--color-paper)',
              border: '1px solid var(--color-paper-ruled)',
            }}
          >
            Sign out
          </button>
        </div>
      </aside>

      {/* ── Mobile bottom bar ────────────────────────────────────────────── */}
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around"
        style={{
          backgroundColor: '#ffffff',
          borderTop: '1px solid var(--color-paper-ruled)',
          height: '60px',
        }}
      >
        {navItems.map(({ href, icon, label }) => {
          const isActive = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center justify-center flex-1 h-full relative"
              style={{ textDecoration: 'none' }}
              aria-label={label}
            >
              <span
                className="text-xl leading-none"
                style={{
                  color: isActive ? 'var(--color-accent)' : 'var(--color-ink-faint)',
                }}
              >
                {icon}
              </span>
              {isActive && (
                <span
                  className="absolute bottom-1.5 rounded-full"
                  style={{
                    width: '4px',
                    height: '4px',
                    backgroundColor: 'var(--color-accent)',
                  }}
                />
              )}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
