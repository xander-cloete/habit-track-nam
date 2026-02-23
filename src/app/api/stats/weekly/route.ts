/**
 * GET /api/stats/weekly?date=YYYY-MM-DD
 * Returns 7-day completion data centred on (or ending at) the given date.
 * Used by the dashboard weekly bar chart.
 *
 * Response shape:
 * {
 *   totalHabits: number,
 *   days: Array<{
 *     date: string,        // YYYY-MM-DD
 *     label: string,       // "Mon", "Tue", …
 *     completed: number,
 *     total: number,
 *     pct: number          // 0-100
 *   }>
 * }
 */
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { unauthorizedError, serverError } from '@/lib/utils/errors';
import { db } from '@/lib/db';
import { habits, habitLogs } from '@/lib/db/schema';
import { eq, and, isNull, inArray, gte, lte } from 'drizzle-orm';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function addDays(dateStr: string, days: number): string {
  const d = new Date(`${dateStr}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export async function GET(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return unauthorizedError();

    const { searchParams } = new URL(request.url);
    const endDate = searchParams.get('date') ?? new Date().toISOString().slice(0, 10);
    const range = Math.min(Math.max(parseInt(searchParams.get('range') ?? '7', 10), 7), 90);
    const startDate = addDays(endDate, -(range - 1)); // N-day window ending on endDate

    // Active habits count
    const activeHabits = await db
      .select({ id: habits.id })
      .from(habits)
      .where(
        and(
          eq(habits.userId, user.id),
          eq(habits.isActive, true),
          isNull(habits.archivedAt),
        ),
      );

    const totalHabits = activeHabits.length;
    const habitIds = activeHabits.map((h) => h.id);

    // All completed logs in the 7-day window
    const logs =
      habitIds.length > 0
        ? await db
            .select({ logDate: habitLogs.logDate, habitId: habitLogs.habitId })
            .from(habitLogs)
            .where(
              and(
                eq(habitLogs.userId, user.id),
                inArray(habitLogs.habitId, habitIds),
                gte(habitLogs.logDate, startDate),
                lte(habitLogs.logDate, endDate),
                eq(habitLogs.status, 'completed' as const),
              ),
            )
        : [];

    // Group by date
    const logsByDate = new Map<string, number>();
    for (const log of logs) {
      logsByDate.set(log.logDate, (logsByDate.get(log.logDate) ?? 0) + 1);
    }

    // Build 7-day array
    const days = Array.from({ length: 7 }, (_, i) => {
      const date = addDays(startDate, i);
      const dayOfWeek = new Date(`${date}T00:00:00Z`).getUTCDay();
      const completed = logsByDate.get(date) ?? 0;
      const pct = totalHabits > 0 ? Math.round((completed / totalHabits) * 100) : 0;

      return {
        date,
        label: DAY_LABELS[dayOfWeek] ?? '',
        completed,
        total: totalHabits,
        pct,
      };
    });

    return Response.json({ totalHabits, days });
  } catch (err) {
    console.error('[GET /api/stats/weekly]', err);
    return serverError();
  }
}
