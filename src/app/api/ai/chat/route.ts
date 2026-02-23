/**
 * POST /api/ai/chat
 * Streaming coaching chat endpoint.
 *
 * Body: {
 *   messages: Array<{ role: 'user' | 'assistant'; content: string }>
 * }
 *
 * Returns: text/plain streaming response (plain text chunks, no SSE envelope).
 */
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { unauthorizedError } from '@/lib/utils/errors';
import { getHabitsByUser } from '@/lib/db/queries/habits';
import { getGoalsByUser } from '@/lib/db/queries/goals';
import { getUserProfile } from '@/lib/db/queries/users';
import { getAnthropicClient, AI_MODEL } from '@/lib/ai/client';
import { db } from '@/lib/db';
import { habits, habitLogs } from '@/lib/db/schema';
import { eq, and, isNull, inArray, gte, lte } from 'drizzle-orm';
import { z } from 'zod';

// ── Validation ─────────────────────────────────────────────────────────────────
const chatSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string().min(1).max(4000),
      }),
    )
    .min(1)
    .max(40),
});

// ── Helpers ────────────────────────────────────────────────────────────────────
function addDays(dateStr: string, n: number): string {
  const d = new Date(`${dateStr}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

async function buildSystemPrompt(userId: string, displayName: string): Promise<string> {
  const today = new Date().toISOString().slice(0, 10);
  const sevenDaysAgo = addDays(today, -6);

  const [userHabits, userGoals] = await Promise.all([
    getHabitsByUser(userId),
    getGoalsByUser(userId),
  ]);

  // 7-day completion snapshot
  const activeHabits = userHabits.filter((h) => h.isActive && !h.archivedAt);
  let weeklyRate = 0;

  if (activeHabits.length > 0) {
    const ids = activeHabits.map((h) => h.id);
    const logs = await db
      .select({ habitId: habitLogs.habitId })
      .from(habitLogs)
      .where(
        and(
          eq(habitLogs.userId, userId),
          inArray(habitLogs.habitId, ids),
          gte(habitLogs.logDate, sevenDaysAgo),
          lte(habitLogs.logDate, today),
          eq(habitLogs.status, 'completed' as const),
        ),
      );
    const maxPossible = activeHabits.length * 7;
    weeklyRate = maxPossible > 0 ? Math.round((logs.length / maxPossible) * 100) : 0;
  }

  const activeGoals = userGoals.filter((g) => g.status === 'active');

  const habitLines = activeHabits
    .slice(0, 10)
    .map((h) => `  • ${h.title} (${h.frequency})`)
    .join('\n') || '  (none yet)';

  const goalLines = activeGoals
    .slice(0, 8)
    .map((g) => `  • [${g.timeframe}] ${g.title}`)
    .join('\n') || '  (none set)';

  return `You are a warm, knowledgeable daily habit coach for ${displayName}, speaking in the style of a bullet journal companion — grounded, concise, and encouraging without being preachy.

Today: ${new Date(today).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}

${displayName}'s HABITS:
${habitLines}

${displayName}'s ACTIVE GOALS:
${goalLines}

7-DAY COMPLETION RATE: ${weeklyRate}%

COACHING GUIDELINES:
- Be specific — reference their actual habits and goals when relevant.
- Keep responses concise (3–6 sentences unless they ask for detail).
- Tone: warm, honest, practical. Never preachy.
- If they report a struggle, validate first, then offer one concrete tip.
- If they share a win, celebrate genuinely then build on it.
- You can suggest schedule adjustments, habit tweaks, or mindset shifts.
- Do NOT invent habits or goals they haven't listed.`;
}

// ── Route ──────────────────────────────────────────────────────────────────────
export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return unauthorizedError();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = chatSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: 'Invalid request', details: parsed.error.flatten() }, { status: 400 });
  }

  const { messages } = parsed.data;

  const profile = await getUserProfile(user.id);
  const displayName =
    profile?.displayName ??
    (user.user_metadata?.display_name as string | undefined) ??
    user.email?.split('@')[0] ??
    'there';

  const systemPrompt = await buildSystemPrompt(user.id, displayName);

  // Stream from Claude
  const stream = getAnthropicClient().messages.stream({
    model: AI_MODEL,
    max_tokens: 512,
    system: systemPrompt,
    messages,
  });

  const readable = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      try {
        for await (const chunk of stream) {
          if (
            chunk.type === 'content_block_delta' &&
            chunk.delta.type === 'text_delta'
          ) {
            controller.enqueue(encoder.encode(chunk.delta.text));
          }
        }
      } finally {
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-cache',
      'X-Accel-Buffering': 'no',
    },
  });
}
