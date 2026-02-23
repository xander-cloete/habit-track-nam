export const maxDuration = 60; // seconds — needed for AI response time on Vercel

/**
 * POST /api/reports/generate
 * Generates (or re-generates) a weekly or monthly habit report.
 *
 * Body: { type: 'weekly' | 'monthly' }
 *
 * Response: { report: Report }
 */
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { unauthorizedError, serverError } from '@/lib/utils/errors';
import { getHabitsByUser } from '@/lib/db/queries/habits';
import { getGoalsByUser } from '@/lib/db/queries/goals';
import { getUserProfile } from '@/lib/db/queries/users';
import { createReport, updateReport } from '@/lib/db/queries/reports';
import { getAnthropicClient, AI_MODEL } from '@/lib/ai/client';
import { db } from '@/lib/db';
import { habitLogs, reports } from '@/lib/db/schema';
import { eq, and, gte, lte, inArray } from 'drizzle-orm';

// ── Types ──────────────────────────────────────────────────────────────────────
interface DailyRate {
  date: string;
  label: string;
  completed: number;
  pct: number;
}

interface HabitRate {
  title: string;
  count: number;
  pct: number;
}

export interface ReportMetrics {
  totalHabits: number;
  totalDays: number;
  totalCompletions: number;
  maxPossible: number;
  overallPct: number;
  bestDay: { date: string; label: string; pct: number } | null;
  worstDay: { date: string; label: string; pct: number } | null;
  dailyRates: DailyRate[];
  topHabits: HabitRate[];
  weakHabits: HabitRate[];
  goalCount: number;
  activeGoalTitles: string[];
}

// ── Validation ─────────────────────────────────────────────────────────────────
const generateSchema = z.object({
  type: z.enum(['weekly', 'monthly']),
});

// ── Helpers ────────────────────────────────────────────────────────────────────
const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function addDays(dateStr: string, n: number): string {
  const d = new Date(`${dateStr}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

function formatPeriodLabel(start: string, end: string): string {
  const s = new Date(`${start}T00:00:00Z`);
  const e = new Date(`${end}T00:00:00Z`);
  const fmt = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  return `${fmt(s)} – ${fmt(e)}`;
}

// ── Route ──────────────────────────────────────────────────────────────────────
export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return unauthorizedError();

    // Parse body
    let body: unknown;
    try { body = await request.json(); } catch { return Response.json({ error: 'Invalid JSON' }, { status: 400 }); }
    const parsed = generateSchema.safeParse(body);
    if (!parsed.success) return Response.json({ error: 'type must be weekly or monthly' }, { status: 400 });

    const { type } = parsed.data;
    const today      = new Date().toISOString().slice(0, 10);
    const totalDays  = type === 'weekly' ? 7 : 30;
    const periodEnd  = today;
    const periodStart = addDays(today, -(totalDays - 1));

    // ── 1. Gather data ─────────────────────────────────────────────────────────
    const [profile, activeHabits, userGoals] = await Promise.all([
      getUserProfile(user.id),
      getHabitsByUser(user.id),
      getGoalsByUser(user.id),
    ]);

    const displayName = profile?.displayName ?? (user.user_metadata?.display_name as string | undefined) ?? user.email?.split('@')[0] ?? 'there';
    const habitIds = activeHabits.map((h) => h.id);

    const logs = habitIds.length > 0
      ? await db
          .select({ logDate: habitLogs.logDate, habitId: habitLogs.habitId })
          .from(habitLogs)
          .where(and(
            eq(habitLogs.userId, user.id),
            inArray(habitLogs.habitId, habitIds),
            gte(habitLogs.logDate, periodStart),
            lte(habitLogs.logDate, periodEnd),
            eq(habitLogs.status, 'completed' as const),
          ))
      : [];

    // ── 2. Compute metrics ─────────────────────────────────────────────────────
    const logsByDate: Record<string, number> = {};
    const habitCounts: Record<string, number> = {};
    for (const log of logs) {
      logsByDate[log.logDate] = (logsByDate[log.logDate] ?? 0) + 1;
      habitCounts[log.habitId] = (habitCounts[log.habitId] ?? 0) + 1;
    }

    const dailyRates: DailyRate[] = Array.from({ length: totalDays }, (_, i) => {
      const date = addDays(periodStart, i);
      const completed = logsByDate[date] ?? 0;
      const pct = activeHabits.length > 0 ? Math.round((completed / activeHabits.length) * 100) : 0;
      const dow = new Date(`${date}T00:00:00Z`).getUTCDay();
      return { date, label: DAY_LABELS[dow] ?? '', completed, pct };
    });

    const overallPct = activeHabits.length > 0
      ? Math.round((logs.length / (activeHabits.length * totalDays)) * 100)
      : 0;

    const sortedByPct = [...dailyRates].sort((a, b) => b.pct - a.pct);
    const bestDay  = sortedByPct[0] ?? null;
    const worstDay = sortedByPct[sortedByPct.length - 1] ?? null;

    const habitRates: HabitRate[] = activeHabits
      .map((h) => ({
        title: h.title,
        count: habitCounts[h.id] ?? 0,
        pct:   Math.round(((habitCounts[h.id] ?? 0) / totalDays) * 100),
      }))
      .sort((a, b) => b.pct - a.pct);

    const topHabits  = habitRates.slice(0, 3);
    const weakHabits = habitRates.length > 3 ? habitRates.slice(-3).reverse() : [];
    const activeGoals = userGoals.filter((g) => g.status === 'active');

    const metricsData: ReportMetrics = {
      totalHabits: activeHabits.length,
      totalDays,
      totalCompletions: logs.length,
      maxPossible: activeHabits.length * totalDays,
      overallPct,
      bestDay:  bestDay  ? { date: bestDay.date,  label: bestDay.label,  pct: bestDay.pct  } : null,
      worstDay: worstDay ? { date: worstDay.date, label: worstDay.label, pct: worstDay.pct } : null,
      dailyRates,
      topHabits,
      weakHabits,
      goalCount: activeGoals.length,
      activeGoalTitles: activeGoals.slice(0, 5).map((g) => g.title),
    };

    // ── 3. Generate AI narrative ───────────────────────────────────────────────
    const periodLabel  = type === 'weekly' ? 'week' : 'month';
    const periodHeader = formatPeriodLabel(periodStart, periodEnd);
    const nextLabel    = type === 'weekly' ? 'next week' : 'next month';

    const aiPrompt = `
You are a warm habit-tracking coach. Write a concise report for ${displayName}'s ${periodLabel} (${periodHeader}).

DATA:
- Habits tracked: ${activeHabits.length}
- Overall completion: ${overallPct}%
- Best day: ${bestDay?.label ?? 'N/A'} at ${bestDay?.pct ?? 0}%
- Worst day: ${worstDay?.label ?? 'N/A'} at ${worstDay?.pct ?? 0}%
- Top habits: ${topHabits.map((h) => `${h.title} (${h.pct}%)`).join(', ') || 'none yet'}
- Needs attention: ${weakHabits.map((h) => `${h.title} (${h.pct}%)`).join(', ') || 'none'}
- Active goals: ${activeGoals.slice(0, 4).map((g) => `"${g.title}"`).join(', ') || 'none set'}

Respond ONLY with valid JSON (no markdown fences) matching this shape exactly:
{
  "narrative": "3-4 sentences: honest, warm summary of the ${periodLabel}.",
  "wins": ["one specific win", "another win if applicable"],
  "challenges": ["one honest challenge if any"],
  "recommendation": "One concrete, specific suggestion for ${nextLabel}.",
  "insights": ["short stat or observation", "short stat or observation", "short stat or observation"]
}

Tone: grounded bullet-journal coach. Be specific to their habits. No generic platitudes.
`.trim();

    let narrativeText = '';
    let insightsData: string[] = [];

    try {
      const result = await getAnthropicClient().messages.create({
        model: AI_MODEL,
        max_tokens: 700,
        messages: [{ role: 'user', content: aiPrompt }],
      });

      const raw = result.content[0]?.type === 'text' ? result.content[0].text.trim() : '{}';
      const cleaned = raw.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();

      const aiParsed = JSON.parse(cleaned) as {
        narrative?: string;
        wins?: string[];
        challenges?: string[];
        recommendation?: string;
        insights?: string[];
      };

      const sections: string[] = [];
      if (aiParsed.narrative) sections.push(aiParsed.narrative);
      if (aiParsed.wins?.length)
        sections.push(`**Wins**\n${aiParsed.wins.map((w) => `• ${w}`).join('\n')}`);
      if (aiParsed.challenges?.length)
        sections.push(`**Challenges**\n${aiParsed.challenges.map((c) => `• ${c}`).join('\n')}`);
      if (aiParsed.recommendation)
        sections.push(`**For ${nextLabel}**\n${aiParsed.recommendation}`);

      narrativeText = sections.join('\n\n');
      insightsData  = aiParsed.insights ?? [];
    } catch (aiErr) {
      console.warn('[reports/generate] AI parse failed', aiErr);
      narrativeText = `This ${periodLabel} you tracked ${activeHabits.length} habits with an overall completion rate of ${overallPct}%. Keep building on your momentum!`;
      insightsData  = [`${overallPct}% overall completion this ${periodLabel}.`];
    }

    // ── 4. Upsert report ───────────────────────────────────────────────────────
    const existing = await db
      .select({ id: reports.id })
      .from(reports)
      .where(and(
        eq(reports.userId, user.id),
        eq(reports.reportType, type),
        eq(reports.periodStart, periodStart),
      ))
      .limit(1);

    const reportPayload = {
      status:       'completed',
      metricsData:  metricsData  as unknown as Record<string, unknown>,
      narrativeText,
      insightsData: insightsData as unknown as Record<string, unknown>,
      generatedAt:  new Date(),
    };

    let report;
    if (existing[0]) {
      report = await updateReport(existing[0].id, user.id, reportPayload);
    } else {
      report = await createReport({
        userId:      user.id,
        reportType:  type,
        periodStart,
        periodEnd,
        ...reportPayload,
      });
    }

    return Response.json({ report });
  } catch (err) {
    console.error('[POST /api/reports/generate]', err);
    return serverError();
  }
}
