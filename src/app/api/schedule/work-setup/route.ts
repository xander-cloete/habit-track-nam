import { createSupabaseServerClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { scheduleBlocks } from '@/lib/db/schema';
import { createScheduleBlock } from '@/lib/db/queries/schedule';
import { eq, and, gte, lte, inArray } from 'drizzle-orm';
import { z } from 'zod';
import { serverError, unauthorizedError } from '@/lib/utils/errors';

// ── Validation ─────────────────────────────────────────────────────────────────
const workSetupSchema = z.object({
  type:         z.enum(['Work', 'School']),
  days:         z.array(z.number().int().min(0).max(6)).min(1),
  startTime:    z.string().regex(/^\d{2}:\d{2}$/),
  endTime:      z.string().regex(/^\d{2}:\d{2}$/),
  commuteStart: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  commuteEnd:   z.string().regex(/^\d{2}:\d{2}$/).optional(),
});

// ── Helpers ────────────────────────────────────────────────────────────────────
function toYMD(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function addDays(dateStr: string, n: number): string {
  const d = new Date(`${dateStr}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return toYMD(d);
}

/**
 * Returns the JS weekday (0=Sun … 6=Sat) adjusted to our Mon-based index:
 *   0=Mon, 1=Tue, 2=Wed, 3=Thu, 4=Fri, 5=Sat, 6=Sun
 */
function toMonBasedDay(dateStr: string): number {
  const jsDay = new Date(`${dateStr}T00:00:00Z`).getUTCDay(); // 0=Sun
  return jsDay === 0 ? 6 : jsDay - 1;
}

/**
 * POST /api/schedule/work-setup
 *
 * Deletes existing work/commute blocks for the next 28 days,
 * then inserts new blocks for matching weekdays.
 */
export async function POST(req: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return unauthorizedError();

    const uid = user.id;
    const body: unknown = await req.json();
    const parsed = workSetupSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: 'Invalid request' }, { status: 400 });
    }

    const { type, days, startTime, endTime, commuteStart, commuteEnd } = parsed.data;

    // Validate time order
    if (startTime >= endTime) {
      return Response.json({ error: 'End time must be after start time.' }, { status: 400 });
    }

    const today   = toYMD(new Date());
    const endDate = addDays(today, 27); // inclusive — 28 days total

    // ── Delete existing work + commute blocks for this window ─────────────────
    await db
      .delete(scheduleBlocks)
      .where(
        and(
          eq(scheduleBlocks.userId, uid),
          gte(scheduleBlocks.blockDate, today),
          lte(scheduleBlocks.blockDate, endDate),
          inArray(scheduleBlocks.category, ['work', 'commute']),
        )
      );

    // ── Insert new blocks for each matching day ───────────────────────────────
    let created = 0;

    for (let i = 0; i < 28; i++) {
      const dateStr   = addDays(today, i);
      const weekday   = toMonBasedDay(dateStr);

      if (!days.includes(weekday)) continue;

      // Main work / school block
      await createScheduleBlock({
        userId:      uid,
        title:       type,
        blockDate:   dateStr,
        startTime,
        endTime,
        category:    'work',
        aiGenerated: false,
      });
      created++;

      // Optional commute block
      if (commuteStart && commuteEnd) {
        await createScheduleBlock({
          userId:      uid,
          title:       'Commute',
          blockDate:   dateStr,
          startTime:   commuteStart,
          endTime:     commuteEnd,
          category:    'commute',
          aiGenerated: false,
        });
        created++;
      }
    }

    return Response.json({ success: true, created }, { status: 201 });
  } catch (err) {
    console.error('[POST /api/schedule/work-setup]', err instanceof Error ? err.message : err);
    return serverError();
  }
}
