/**
 * GET /api/ai/motivation
 * Returns the user's daily motivation message.
 * Checks the cache (motivation_messages table) first; generates via Claude if stale.
 *
 * Response: { message: string; fresh: boolean }
 */
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { unauthorizedError, serverError } from '@/lib/utils/errors';
import { getValidMotivation, createMotivationMessage } from '@/lib/db/queries/motivation';
import { getHabitsByUser } from '@/lib/db/queries/habits';
import { getGoalsByUser } from '@/lib/db/queries/goals';
import { getUserProfile } from '@/lib/db/queries/users';
import { getAnthropicClient, AI_MODEL } from '@/lib/ai/client';
import { db } from '@/lib/db';
import { habits, habitLogs } from '@/lib/db/schema';
import { eq, and, isNull, inArray, gte } from 'drizzle-orm';

/** Returns UTC midnight of tomorrow — when the message expires. */
function nextMidnightUTC(): Date {
  const d = new Date();
  d.setUTCHours(24, 0, 0, 0);
  return d;
}

/** Quick 7-day completion rate for context. */
async function getWeeklyRate(userId: string): Promise<number> {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  const startDate = sevenDaysAgo.toISOString().slice(0, 10);

  const activeHabits = await db
    .select({ id: habits.id })
    .from(habits)
    .where(and(eq(habits.userId, userId), eq(habits.isActive, true), isNull(habits.archivedAt)));

  if (!activeHabits.length) return 0;

  const ids = activeHabits.map((h) => h.id);
  const logs = await db
    .select({ habitId: habitLogs.habitId })
    .from(habitLogs)
    .where(
      and(
        eq(habitLogs.userId, userId),
        inArray(habitLogs.habitId, ids),
        gte(habitLogs.logDate, startDate),
        eq(habitLogs.status, 'completed' as const),
      ),
    );

  const maxPossible = activeHabits.length * 7;
  return maxPossible > 0 ? Math.round((logs.length / maxPossible) * 100) : 0;
}

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return unauthorizedError();

    // ── 1. Check cache ────────────────────────────────────────────────────────
    const cached = await getValidMotivation(user.id);
    if (cached) {
      return Response.json({ message: cached.messageText, fresh: false });
    }

    // ── 2. Gather context for generation ─────────────────────────────────────
    const [profile, userHabits, userGoals, weeklyRate] = await Promise.all([
      getUserProfile(user.id),
      getHabitsByUser(user.id),
      getGoalsByUser(user.id),
      getWeeklyRate(user.id),
    ]);

    const displayName =
      profile?.displayName ??
      user.user_metadata?.display_name as string ??
      user.email?.split('@')[0] ??
      'there';

    const today = new Date().toLocaleDateString('en-US', {
      weekday: 'long', month: 'long', day: 'numeric',
    });

    const habitsList = userHabits
      .slice(0, 8)
      .map((h) => `${h.title} (${h.frequency})`)
      .join(', ') || 'none yet';

    const activeGoals = userGoals
      .filter((g) => g.status === 'active')
      .slice(0, 5)
      .map((g) => `"${g.title}" (${g.timeframe})`)
      .join(', ') || 'none set';

    const prompt = `
You are a warm, thoughtful daily habit coach in the bullet-journal style.
Write a single short motivational message (2–3 sentences) for ${displayName} to start their day.
Today is ${today}.

Their habits: ${habitsList}
Active goals: ${activeGoals}
7-day completion rate: ${weeklyRate}%

Rules:
- Speak directly to them ("you", "your").
- Be specific to at least one of their habits or goals.
- Tone: warm, grounded, never preachy or over-the-top.
- No hashtags, no bullet points, no sign-off — just the message.
`.trim();

    // ── 3. Generate with Claude ───────────────────────────────────────────────
    const result = await getAnthropicClient().messages.create({
      model: AI_MODEL,
      max_tokens: 180,
      messages: [{ role: 'user', content: prompt }],
    });

    const messageText =
      result.content[0]?.type === 'text'
        ? result.content[0].text.trim()
        : `Keep showing up, ${displayName} — every small step matters.`;

    // ── 4. Cache until tomorrow midnight UTC ──────────────────────────────────
    await createMotivationMessage({
      userId: user.id,
      messageText,
      expiresAt: nextMidnightUTC(),
      contextSnapshot: { weeklyRate, habitCount: userHabits.length },
    });

    return Response.json({ message: messageText, fresh: true });
  } catch (err) {
    console.error('[GET /api/ai/motivation]', err);
    // Non-fatal — return a fallback rather than 500
    return Response.json({
      message: 'Every habit you keep is a vote for the person you want to become.',
      fresh: false,
    });
  }
}
