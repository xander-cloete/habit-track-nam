'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { UserProfile } from '@/lib/db/schema';

const COACHING_LABELS: Record<string, string> = {
  gentle:   '🌱 Gentle',
  balanced: '⚖️ Balanced',
  direct:   '🎯 Direct',
};

export default function ProfilePage() {
  const router = useRouter();

  const [profile, setProfile]         = useState<UserProfile | null>(null);
  const [email, setEmail]             = useState('');
  const [loading, setLoading]         = useState(true);

  // Reset flow state
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [resetting, setResetting]     = useState(false);
  const [resetError, setResetError]   = useState('');

  // Delete account flow state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteText, setDeleteText]               = useState('');
  const [deleting, setDeleting]                   = useState(false);
  const [deleteError, setDeleteError]             = useState('');

  useEffect(() => {
    // Load profile
    fetch('/api/users/profile')
      .then((r) => r.json() as Promise<{ profile: UserProfile }>)
      .then(({ profile: p }) => setProfile(p))
      .catch(() => null)
      .finally(() => setLoading(false));

    // Load email from Supabase session (available on window if needed)
    // We'll get it from the layout's server props via a simple meta tag approach:
    // Instead, just call /api/users/profile and get it from there if available.
  }, []);

  async function handleReset() {
    if (confirmText !== 'RESET') return;
    setResetting(true);
    setResetError('');
    try {
      const res = await fetch('/api/users/reset', { method: 'POST' });
      if (!res.ok) throw new Error('Reset failed');
      // Redirect to onboarding
      router.replace('/onboarding');
    } catch {
      setResetError('Something went wrong. Please try again.');
      setResetting(false);
    }
  }

  async function handleDeleteAccount() {
    if (deleteText !== 'DELETE MY ACCOUNT') return;
    setDeleting(true);
    setDeleteError('');
    try {
      const res = await fetch('/api/users/delete-account', { method: 'POST' });
      if (!res.ok) throw new Error('Delete failed');
      // Redirect to register — account is gone
      router.replace('/register');
    } catch {
      setDeleteError('Something went wrong. Please try again.');
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: 'var(--color-paper)' }}>
        <div
          className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
          style={{ borderColor: 'var(--color-accent)', borderTopColor: 'transparent' }}
        />
      </div>
    );
  }

  const initials = (profile?.displayName ?? '?').charAt(0).toUpperCase();

  return (
    <div
      className="min-h-screen px-6 py-10"
      style={{ backgroundColor: 'var(--color-paper)' }}
    >
      <div className="max-w-xl mx-auto flex flex-col gap-8">

        {/* ── Page title ─────────────────────────────────────────────────────── */}
        <div>
          <h1 className="font-hand text-3xl" style={{ color: 'var(--color-ink)' }}>
            My Profile
          </h1>
          <p className="font-body text-sm mt-1" style={{ color: 'var(--color-ink-faint)' }}>
            Your account details and settings
          </p>
        </div>

        {/* ── Avatar + name card ─────────────────────────────────────────────── */}
        <div
          className="rounded-2xl p-6 flex items-center gap-5"
          style={{
            backgroundColor: 'var(--color-paper-dark)',
            border: '1px solid var(--color-paper-ruled)',
          }}
        >
          {/* Avatar */}
          <div
            className="flex-shrink-0 flex items-center justify-center rounded-full font-hand text-3xl"
            style={{
              width: '72px',
              height: '72px',
              backgroundColor: 'var(--color-accent)',
              color: '#ffffff',
            }}
          >
            {initials}
          </div>

          <div className="flex flex-col gap-1 min-w-0">
            <p className="font-hand text-2xl truncate" style={{ color: 'var(--color-ink)' }}>
              {profile?.displayName ?? '—'}
            </p>
            <p className="font-body text-sm" style={{ color: 'var(--color-ink-faint)' }}>
              {email || 'Signed in'}
            </p>
          </div>
        </div>

        {/* ── Details card ───────────────────────────────────────────────────── */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{ border: '1px solid var(--color-paper-ruled)' }}
        >
          {[
            { label: 'Timezone',       value: profile?.timezone       ?? '—' },
            { label: 'Wake time',      value: profile?.wakeTime       ?? '—' },
            { label: 'Sleep time',     value: profile?.sleepTime      ?? '—' },
            { label: 'Coaching style', value: COACHING_LABELS[profile?.motivationStyle ?? ''] ?? '—' },
          ].map(({ label, value }, i, arr) => (
            <div
              key={label}
              className="flex items-center justify-between px-5 py-4"
              style={{
                backgroundColor: 'var(--color-paper)',
                borderBottom: i < arr.length - 1 ? '1px solid var(--color-paper-ruled)' : 'none',
              }}
            >
              <span className="font-body text-sm font-semibold" style={{ color: 'var(--color-ink-faint)' }}>
                {label}
              </span>
              <span className="font-hand text-base" style={{ color: 'var(--color-ink)' }}>
                {value}
              </span>
            </div>
          ))}
        </div>

        {/* ── Danger zone ────────────────────────────────────────────────────── */}
        <div
          className="rounded-2xl p-6"
          style={{
            border: '1px solid rgba(185,28,28,0.25)',
            backgroundColor: 'rgba(185,28,28,0.03)',
          }}
        >
          <h2 className="font-hand text-xl mb-1" style={{ color: '#B91C1C' }}>
            Danger Zone
          </h2>
          <p className="font-body text-sm mb-4" style={{ color: 'var(--color-ink-faint)' }}>
            Reset your account to start fresh. This permanently deletes all your habits,
            goals, journal entries, planner blocks, and reports. Your login is kept.
          </p>

          {!showConfirm ? (
            <button
              onClick={() => setShowConfirm(true)}
              className="font-hand text-lg px-6 py-2.5 rounded-xl transition-opacity hover:opacity-80"
              style={{
                backgroundColor: 'rgba(185,28,28,0.1)',
                color: '#B91C1C',
                border: '1px solid rgba(185,28,28,0.3)',
              }}
            >
              Reset & Start Fresh
            </button>
          ) : (
            <div className="flex flex-col gap-3">
              <p className="font-body text-sm font-semibold" style={{ color: '#B91C1C' }}>
                Type <strong>RESET</strong> to confirm:
              </p>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="RESET"
                className="rounded-xl px-4 py-3 font-body text-base outline-none border"
                style={{
                  backgroundColor: 'var(--color-paper)',
                  color: 'var(--color-ink)',
                  borderColor: confirmText === 'RESET' ? '#B91C1C' : 'var(--color-paper-ruled)',
                }}
                autoFocus
              />

              {resetError && (
                <p className="font-body text-sm" style={{ color: '#B91C1C' }}>{resetError}</p>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => { setShowConfirm(false); setConfirmText(''); setResetError(''); }}
                  className="flex-1 font-hand text-lg py-2.5 rounded-xl transition-opacity hover:opacity-70"
                  style={{
                    backgroundColor: 'var(--color-paper-dark)',
                    color: 'var(--color-ink-faint)',
                    border: '1px solid var(--color-paper-ruled)',
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => void handleReset()}
                  disabled={confirmText !== 'RESET' || resetting}
                  className="flex-[2] font-hand text-lg py-2.5 rounded-xl transition-opacity"
                  style={{
                    backgroundColor: confirmText === 'RESET' ? '#B91C1C' : 'rgba(185,28,28,0.2)',
                    color: '#ffffff',
                    opacity: confirmText === 'RESET' && !resetting ? 1 : 0.5,
                    cursor: confirmText === 'RESET' && !resetting ? 'pointer' : 'not-allowed',
                  }}
                >
                  {resetting ? 'Resetting…' : 'Confirm Reset'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── Delete Account ─────────────────────────────────────────────────── */}
        <div
          className="rounded-2xl p-6"
          style={{
            border: '1px solid rgba(120,0,0,0.3)',
            backgroundColor: 'rgba(120,0,0,0.04)',
          }}
        >
          <h2 className="font-hand text-xl mb-1" style={{ color: '#7B0000' }}>
            Delete Account
          </h2>
          <p className="font-body text-sm mb-4" style={{ color: 'var(--color-ink-faint)' }}>
            Permanently deletes your account and <strong>all</strong> associated data.
            Your email can be re-used to register a new account afterwards.
            <br />
            <strong style={{ color: '#7B0000' }}>This cannot be undone.</strong>
          </p>

          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="font-hand text-lg px-6 py-2.5 rounded-xl transition-opacity hover:opacity-80"
              style={{
                backgroundColor: 'rgba(120,0,0,0.1)',
                color: '#7B0000',
                border: '1px solid rgba(120,0,0,0.3)',
              }}
            >
              Delete My Account
            </button>
          ) : (
            <div className="flex flex-col gap-3">
              <p className="font-body text-sm font-semibold" style={{ color: '#7B0000' }}>
                Type <strong>DELETE MY ACCOUNT</strong> to confirm:
              </p>
              <input
                type="text"
                value={deleteText}
                onChange={(e) => setDeleteText(e.target.value)}
                placeholder="DELETE MY ACCOUNT"
                className="rounded-xl px-4 py-3 font-body text-base outline-none border"
                style={{
                  backgroundColor: 'var(--color-paper)',
                  color: 'var(--color-ink)',
                  borderColor: deleteText === 'DELETE MY ACCOUNT' ? '#7B0000' : 'var(--color-paper-ruled)',
                }}
                autoFocus
              />

              {deleteError && (
                <p className="font-body text-sm" style={{ color: '#7B0000' }}>{deleteError}</p>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => { setShowDeleteConfirm(false); setDeleteText(''); setDeleteError(''); }}
                  className="flex-1 font-hand text-lg py-2.5 rounded-xl transition-opacity hover:opacity-70"
                  style={{
                    backgroundColor: 'var(--color-paper-dark)',
                    color: 'var(--color-ink-faint)',
                    border: '1px solid var(--color-paper-ruled)',
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => void handleDeleteAccount()}
                  disabled={deleteText !== 'DELETE MY ACCOUNT' || deleting}
                  className="flex-[2] font-hand text-lg py-2.5 rounded-xl transition-opacity"
                  style={{
                    backgroundColor: deleteText === 'DELETE MY ACCOUNT' ? '#7B0000' : 'rgba(120,0,0,0.2)',
                    color: '#ffffff',
                    opacity: deleteText === 'DELETE MY ACCOUNT' && !deleting ? 1 : 0.5,
                    cursor: deleteText === 'DELETE MY ACCOUNT' && !deleting ? 'pointer' : 'not-allowed',
                  }}
                >
                  {deleting ? 'Deleting…' : 'Confirm Delete'}
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
