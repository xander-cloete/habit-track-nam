'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const supabase = createSupabaseBrowserClient();
      const { error: authError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?next=/settings`,
      });

      if (authError) {
        setError(authError.message);
        return;
      }

      setSent(true);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="text-center">
        <div className="text-5xl mb-4">📬</div>
        <h2
          className="text-3xl font-bold mb-3"
          style={{ fontFamily: 'var(--font-caveat)', color: 'var(--color-ink)' }}
        >
          Reset link sent!
        </h2>
        <p
          className="text-sm leading-relaxed mb-6"
          style={{ fontFamily: 'var(--font-body)', color: 'var(--color-ink-light)' }}
        >
          Check <strong>{email}</strong> for a password reset link.
        </p>
        <Link
          href="/login"
          className="text-sm font-semibold hover:underline"
          style={{ fontFamily: 'var(--font-body)', color: 'var(--color-accent)' }}
        >
          ← Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <>
      <h2
        className="text-3xl font-bold mb-2"
        style={{ fontFamily: 'var(--font-caveat)', color: 'var(--color-ink)' }}
      >
        Reset password
      </h2>
      <p
        className="mb-8 text-sm"
        style={{ fontFamily: 'var(--font-body)', color: 'var(--color-ink-light)' }}
      >
        Enter your email and we&apos;ll send you a reset link.
      </p>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium mb-1"
            style={{ fontFamily: 'var(--font-body)', color: 'var(--color-ink-light)' }}
          >
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            placeholder="you@example.com"
            className="w-full px-4 py-3 rounded text-base border-2 outline-none"
            style={{
              fontFamily: 'var(--font-body)',
              background: 'var(--color-paper)',
              borderColor: 'var(--color-pencil)',
              color: 'var(--color-ink)',
            }}
            onFocus={(e) => (e.target.style.borderColor = 'var(--color-accent)')}
            onBlur={(e) => (e.target.style.borderColor = 'var(--color-pencil)')}
          />
        </div>

        {error && (
          <div
            className="px-4 py-3 rounded text-sm border"
            style={{
              background: 'var(--color-accent-red-light)',
              borderColor: 'var(--color-accent-red)',
              color: 'var(--color-accent-red)',
              fontFamily: 'var(--font-body)',
            }}
          >
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 px-6 rounded font-semibold text-base cursor-pointer disabled:opacity-60"
          style={{
            fontFamily: 'var(--font-caveat)',
            fontSize: '1.125rem',
            background: loading ? 'var(--color-pencil)' : 'var(--color-ink)',
            color: 'var(--color-paper)',
          }}
        >
          {loading ? 'Sending…' : 'Send reset link'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm" style={{ fontFamily: 'var(--font-body)', color: 'var(--color-ink-light)' }}>
        <Link href="/login" className="hover:underline" style={{ color: 'var(--color-accent)' }}>
          ← Back to sign in
        </Link>
      </p>
    </>
  );
}
