import { createSupabaseServerClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import {
  habits,
  goals,
  scheduleBlocks,
  lifeAreas,
  motivationMessages,
  reports,
  journalEntries,
  onboardingResponses,
  usersProfiles,
} from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { serverError, unauthorizedError } from '@/lib/utils/errors';

/**
 * POST /api/users/reset
 * Deletes all user-generated data and resets onboarding so the user
 * can start fresh. The auth account and profile row are kept.
 */
export async function POST() {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return unauthorizedError();

    const uid = user.id;

    // Delete in dependency order (children before parents).
    // habit_logs cascade from habits; goal_milestones cascade from goals.
    await db.delete(habits).where(eq(habits.userId, uid));
    await db.delete(goals).where(eq(goals.userId, uid));
    await db.delete(scheduleBlocks).where(eq(scheduleBlocks.userId, uid));
    await db.delete(lifeAreas).where(eq(lifeAreas.userId, uid));
    await db.delete(motivationMessages).where(eq(motivationMessages.userId, uid));
    await db.delete(reports).where(eq(reports.userId, uid));
    await db.delete(journalEntries).where(eq(journalEntries.userId, uid));
    await db.delete(onboardingResponses).where(eq(onboardingResponses.userId, uid));

    // Clear onboarding timestamp so middleware routes back to /onboarding
    await db
      .update(usersProfiles)
      .set({ onboardingCompletedAt: null, updatedAt: new Date() })
      .where(eq(usersProfiles.id, uid));

    // Reset Supabase auth user metadata flag
    await supabase.auth.updateUser({ data: { onboarding_completed: false } });

    return Response.json({ success: true });
  } catch (err) {
    console.error('[POST /api/users/reset]', err instanceof Error ? err.message : err);
    return serverError();
  }
}
