import { createSupabaseServerClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { scheduleBlocks, habits, usersProfiles } from '@/lib/db/schema';
import { createScheduleBlock } from '@/lib/db/queries/schedule';
import { eq, and, gte, lte, inArray } from 'drizzle-orm';
import { z } from 'zod';
import { serverError, unauthorizedError } from '@/lib/utils/errors';
import { getAnthropicClient, AI_MODEL_FAST } from '@/lib/ai/client';
import {
  buildReschedulePrompt,
  COACHING_SYSTEM_PROMPT,
  type GeneratedScheduleBlock,
} from '@/lib/ai/prompts/onboarding';

export const maxDuration = 60; // seconds — needed for the AI reschedule call on Vercel

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

    // ── Remove AI-generated recurring blocks that conflict with work hours ─
    // Work and commute time must be treated as hard blockers. Any habit or
    // personal block the AI placed inside these windows gets removed so the
    // user isn't shown impossible tasks during working hours.
    const protectedWindows: Array<{ start: string; end: string }> = [
      { start: startTime, end: endTime },
      ...(commuteStart && commuteEnd ? [{ start: commuteStart, end: commuteEnd }] : []),
    ];

    // Fetch all AI-generated recurring blocks for this user that are today
    // or in the future.  The date guard ensures we never delete historical
    // blocks that the user has already completed — past data is immutable.
    const aiRecurringBlocks = await db
      .select({
        id:        scheduleBlocks.id,
        startTime: scheduleBlocks.startTime,
        endTime:   scheduleBlocks.endTime,
      })
      .from(scheduleBlocks)
      .where(
        and(
          eq(scheduleBlocks.userId,      uid),
          eq(scheduleBlocks.aiGenerated, true),
          eq(scheduleBlocks.isRecurring, true),
          gte(scheduleBlocks.blockDate,  today),   // ← protect past completions
        )
      );

    // Standard interval-overlap test: A overlaps B when A.start < B.end AND A.end > B.start
    const conflictingIds = aiRecurringBlocks
      .filter(block =>
        protectedWindows.some(w => block.startTime < w.end && block.endTime > w.start)
      )
      .map(block => block.id);

    let removed = 0;
    if (conflictingIds.length > 0) {
      await db
        .delete(scheduleBlocks)
        .where(
          and(
            eq(scheduleBlocks.userId, uid),
            inArray(scheduleBlocks.id, conflictingIds),
          )
        );
      removed = conflictingIds.length;
    }

    // ── AI Reschedule: rebuild free-time blocks for displaced habits ──────────
    // If any AI blocks were removed, ask Claude to redistribute those habits
    // into the windows that remain free outside work/commute hours.
    // This is best-effort — a failure here does NOT fail the whole request.
    let rescheduled = 0;

    if (removed > 0) {
      try {
        // Fetch the user's wake/sleep times
        const profileRows = await db
          .select({ wakeTime: usersProfiles.wakeTime, sleepTime: usersProfiles.sleepTime })
          .from(usersProfiles)
          .where(eq(usersProfiles.id, uid))
          .limit(1);

        const profile = profileRows[0];

        if (profile) {
          // Fetch the user's active habits so the AI knows what to schedule
          const userHabits = await db
            .select({ title: habits.title, description: habits.description, icon: habits.icon })
            .from(habits)
            .where(and(eq(habits.userId, uid), eq(habits.isActive, true)));

          // Fetch surviving AI recurring blocks so the AI doesn't overlap them
          const remainingBlocks = await db
            .select({
              title:     scheduleBlocks.title,
              startTime: scheduleBlocks.startTime,
              endTime:   scheduleBlocks.endTime,
            })
            .from(scheduleBlocks)
            .where(
              and(
                eq(scheduleBlocks.userId,      uid),
                eq(scheduleBlocks.aiGenerated, true),
                eq(scheduleBlocks.isRecurring, true),
              )
            );

          const prompt = buildReschedulePrompt({
            wakeTime:       profile.wakeTime  ?? '07:00',
            sleepTime:      profile.sleepTime ?? '23:00',
            workType:       type,
            workStart:      startTime,
            workEnd:        endTime,
            workDays:       days,
            commuteStart,
            commuteEnd,
            habits:         userHabits,
            existingBlocks: remainingBlocks,
            displacedCount: removed,
          });

          const message = await getAnthropicClient().messages.create({
            model:      AI_MODEL_FAST,
            max_tokens: 1024,
            system:     COACHING_SYSTEM_PROMPT,
            messages:   [{ role: 'user', content: prompt }],
          });

          const text = message.content[0].type === 'text' ? message.content[0].text : '';

          let aiResult: { scheduleBlocks: GeneratedScheduleBlock[] };
          try {
            aiResult = JSON.parse(text);
          } catch {
            const match = text.match(/\{[\s\S]*\}/);
            aiResult = match ? JSON.parse(match[0]) : { scheduleBlocks: [] };
          }

          // Build one row per block per day for the same 28-day window used
          // by work/commute blocks.  A single batch INSERT is far more
          // efficient than 28 × N individual round-trips.
          const rescheduleRows: {
            userId: string; title: string; blockDate: string;
            startTime: string; endTime: string; category: string;
            description: string | null; isRecurring: boolean;
            recurringConfig: Record<string, unknown>; aiGenerated: boolean;
          }[] = [];

          for (const block of aiResult.scheduleBlocks ?? []) {
            // Safety guard: skip any block that still overlaps a protected window
            const isBlocked = protectedWindows.some(
              w => block.startTime < w.end && block.endTime > w.start
            );
            if (isBlocked) continue;

            for (let i = 0; i < 28; i++) {
              rescheduleRows.push({
                userId:          uid,
                title:           block.title,
                blockDate:       addDays(today, i),
                startTime:       block.startTime,
                endTime:         block.endTime,
                category:        block.category,
                description:     block.description ?? null,
                isRecurring:     true,
                recurringConfig: { type: 'daily' },
                aiGenerated:     true,
              });
            }
          }

          if (rescheduleRows.length > 0) {
            await db.insert(scheduleBlocks).values(rescheduleRows);
            rescheduled = rescheduleRows.length;
          }
        }
      } catch (aiErr) {
        // AI rescheduling is non-critical — log but don't surface to the client
        console.error('[work-setup] AI reschedule failed:', aiErr instanceof Error ? aiErr.message : aiErr);
      }
    }

    return Response.json({ success: true, created, removed, rescheduled }, { status: 201 });
  } catch (err) {
    console.error('[POST /api/schedule/work-setup]', err instanceof Error ? err.message : err);
    return serverError();
  }
}
