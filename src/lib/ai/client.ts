import Anthropic from '@anthropic-ai/sdk';

declare global {
  // eslint-disable-next-line no-var
  var __anthropic: Anthropic | undefined;
}

// Lazy singleton — instantiated on first call, not at module load time.
// This avoids "ANTHROPIC_API_KEY is not set" errors during Next.js build.
export function getAnthropicClient(): Anthropic {
  if (globalThis.__anthropic) return globalThis.__anthropic;

  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY environment variable is not set');
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  // Cache in dev to survive hot-reload
  if (process.env.NODE_ENV !== 'production') {
    globalThis.__anthropic = client;
  }

  return client;
}

// Full model — used for coach chat & motivation (streaming / short calls)
export const AI_MODEL = 'claude-sonnet-4-6' as const;

// Fast model — used for plan generation & reports to stay within Vercel's 10s limit
export const AI_MODEL_FAST = 'claude-haiku-4-5' as const;
