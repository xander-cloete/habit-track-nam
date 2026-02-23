'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const supabase = createSupabaseBrowserClient();
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        setError(authError.message);
        return;
      }

      router.push('/dashboard');
      router.refresh();
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <h2
        className="text-3xl font-bold mb-2"
        style={{ fontFamily: 'var(--font-caveat)', color: 'var(--color-ink)' }}
      >
        Welcome back
      </h2>
      <p
        className="mb-8 text-sm"
        style={{ fontFamily: 'var(--font-body)', color: 'var(--color-ink-light)' }}
      >
        Sign in to your journal
      </p>

      <form onSubmit={handleSubmit} className="space-y-5">
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
            autoComplete="current-password"
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

        {/* Forgot password */}
        <div className="flex justify-end">
          <Link
            href="/forgot-password"
            className="text-sm hover:underline"
            style={{ fontFamily: 'var(--font-body)', color: 'var(--color-accent)' }}
          >
            Forgot password?
          </Link>
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
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      {/* Register link */}
      <p
        className="mt-6 text-center text-sm"
        style={{ fontFamily: 'var(--font-body)', color: 'var(--color-ink-light)' }}
      >
        Don&apos;t have an account?{' '}
        <Link
          href="/register"
          className="font-semibold hover:underline"
          style={{ color: 'var(--color-accent)' }}
        >
          Start your journal →
        </Link>
      </p>
    </>
  );
}
