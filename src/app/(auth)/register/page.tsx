'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

export default function RegisterPage() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setLoading(true);

    try {
      const supabase = createSupabaseBrowserClient();
      const { error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: displayName,
            onboarding_completed: false,
          },
          // After email confirmation, redirect to onboarding
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/onboarding`,
        },
      });

      if (authError) {
        setError(authError.message);
        return;
      }

      setSuccess(true);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  // ── Success state ─────────────────────────────────────────────────────────
  if (success) {
    return (
      <div className="text-center">
        <div className="text-5xl mb-4">✉️</div>
        <h2
          className="text-3xl font-bold mb-3"
          style={{ fontFamily: 'var(--font-caveat)', color: 'var(--color-ink)' }}
        >
          Check your email!
        </h2>
        <p
          className="text-sm leading-relaxed"
          style={{ fontFamily: 'var(--font-body)', color: 'var(--color-ink-light)' }}
        >
          We sent a confirmation link to <strong>{email}</strong>.
          <br />
          Click it to activate your account and start your journal.
        </p>
        <div
          className="mt-6 px-4 py-3 rounded text-sm"
          style={{
            background: 'var(--color-accent-green-light)',
            color: 'var(--color-accent-green)',
            fontFamily: 'var(--font-body)',
          }}
        >
          After confirming, you&apos;ll complete a short assessment to personalize your experience.
        </div>
      </div>
    );
  }

  // ── Register form ─────────────────────────────────────────────────────────
  return (
    <>
      <h2
        className="text-3xl font-bold mb-2"
        style={{ fontFamily: 'var(--font-caveat)', color: 'var(--color-ink)' }}
      >
        Start your journal
      </h2>
      <p
        className="mb-8 text-sm"
        style={{ fontFamily: 'var(--font-body)', color: 'var(--color-ink-light)' }}
      >
        Create your account — free forever
      </p>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Display name */}
        <div>
          <label
            htmlFor="displayName"
            className="block text-sm font-medium mb-1"
            style={{ fontFamily: 'var(--font-body)', color: 'var(--color-ink-light)' }}
          >
            Your name
          </label>
          <input
            id="displayName"
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            required
            autoComplete="name"
            placeholder="Alex"
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

        {/* Email */}
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

        {/* Password */}
        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium mb-1"
            style={{ fontFamily: 'var(--font-body)', color: 'var(--color-ink-light)' }}
          >
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="new-password"
            placeholder="Min. 8 characters"
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

        {/* Confirm password */}
        <div>
          <label
            htmlFor="confirmPassword"
            className="block text-sm font-medium mb-1"
            style={{ fontFamily: 'var(--font-body)', color: 'var(--color-ink-light)' }}
          >
            Confirm password
          </label>
          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            autoComplete="new-password"
            placeholder="••••••••"
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

        {/* Error */}
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

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 px-6 rounded font-semibold text-base cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          style={{
            fontFamily: 'var(--font-caveat)',
            fontSize: '1.125rem',
            background: loading ? 'var(--color-pencil)' : 'var(--color-ink)',
            color: 'var(--color-paper)',
          }}
        >
          {loading ? 'Creating account…' : 'Create account →'}
        </button>
      </form>

      {/* Login link */}
      <p
        className="mt-6 text-center text-sm"
        style={{ fontFamily: 'var(--font-body)', color: 'var(--color-ink-light)' }}
      >
        Already have an account?{' '}
        <Link
          href="/login"
          className="font-semibold hover:underline"
          style={{ color: 'var(--color-accent)' }}
        >
          Sign in
        </Link>
      </p>
    </>
  );
}
