import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
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
 * POST /api/users/delete-account
 *
 * Permanently deletes ALL user data AND the Supabase auth account.
 * After this call the email can be used to register a new account.
 *
 * Deletion order:
 *   habits       → cascades habit_logs
 *   goals        → cascades goal_milestones
 *   scheduleBlocks, lifeAreas, motivationMessages, reports,
 *   journalEntries, onboardingResponses
 *   usersProfiles (the profile row itself)
 *   auth user    → via admin client (requires SUPABASE_SERVICE_ROLE_KEY)
 */
export async function POST() {
  try {
    // ── Authenticate ──────────────────────────────────────────────────────────
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return unauthorizedError();

    const uid = user.id;

    // ── Delete all user-generated data (children before parents) ─────────────
    await db.delete(habits).where(eq(habits.userId, uid));
    await db.delete(goals).where(eq(goals.userId, uid));
    await db.delete(scheduleBlocks).where(eq(scheduleBlocks.userId, uid));
    await db.delete(lifeAreas).where(eq(lifeAreas.userId, uid));
    await db.delete(motivationMessages).where(eq(motivationMessages.userId, uid));
    await db.delete(reports).where(eq(reports.userId, uid));
    await db.delete(journalEntries).where(eq(journalEntries.userId, uid));
    await db.delete(onboardingResponses).where(eq(onboardingResponses.userId, uid));

    // ── Delete the profile row itself ─────────────────────────────────────────
    await db.delete(usersProfiles).where(eq(usersProfiles.id, uid));

    // ── Delete the Supabase auth user (requires service role) ─────────────────
    const adminClient = createSupabaseAdminClient();
    const { error: deleteAuthError } = await adminClient.auth.admin.deleteUser(uid);

    if (deleteAuthError) {
      console.error('[POST /api/users/delete-account] auth.admin.deleteUser failed:', deleteAuthError.message);
      // Data is already deleted — auth user removal failure is non-fatal for
      // the user experience but we log it for ops visibility.
      return Response.json({ success: true, warning: 'Data deleted but auth account could not be removed.' });
    }

    return Response.json({ success: true });
  } catch (err) {
    console.error('[POST /api/users/delete-account]', err instanceof Error ? err.message : err);
    return serverError();
  }
}
