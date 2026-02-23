import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono, Caveat, Kalam, Indie_Flower, Patrick_Hand, Satisfy } from 'next/font/google';
import Providers from './providers';
import './globals.css';

// ── Geist (system UI elements, inputs) ───────────────────────────────────────
const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
  display: 'swap',
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
  display: 'swap',
});

// ── Caveat (handwritten headings, numbers, habit tracker labels) ──────────────
const caveat = Caveat({
  variable: '--font-caveat',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

// ── Kalam (handwritten body text, descriptions) ───────────────────────────────
const kalam = Kalam({
  variable: '--font-kalam',
  subsets: ['latin'],
  weight: ['300', '400', '700'],
  display: 'swap',
});

// ── Indie Flower (bubbly, casual handwriting) ─────────────────────────────────
const indieFlower = Indie_Flower({
  variable: '--font-indie-flower',
  subsets: ['latin'],
  weight: '400',
  display: 'swap',
});

// ── Patrick Hand (clean, print-like handwriting) ──────────────────────────────
const patrickHand = Patrick_Hand({
  variable: '--font-patrick-hand',
  subsets: ['latin'],
  weight: '400',
  display: 'swap',
});

// ── Satisfy (elegant cursive) ─────────────────────────────────────────────────
const satisfy = Satisfy({
  variable: '--font-satisfy',
  subsets: ['latin'],
  weight: '400',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'Habit Tracker — Your Daily Journal Coach',
    template: '%s | Habit Tracker',
  },
  description:
    'An AI-powered habit tracking and daily schedule coaching app with a paper and pen aesthetic. Build routines, track goals, and grow — one day at a time.',
  keywords: ['habit tracker', 'daily planner', 'goal setting', 'AI coaching', 'routine builder'],
};

export const viewport: Viewport = {
  themeColor: '#FDF8F0',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body
        className={[
          geistSans.variable,
          geistMono.variable,
          caveat.variable,
          kalam.variable,
          indieFlower.variable,
          patrickHand.variable,
          satisfy.variable,
          'antialiased',
          'h-full',
        ].join(' ')}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
