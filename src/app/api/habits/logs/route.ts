/**
 * GET /api/habits/logs?date=YYYY-MM-DD
 * Returns all habit_logs for the authenticated user on a given date.
 * Used by the dashboard habit grid to show today's completions in one request.
 */
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { unauthorizedError, serverError } from '@/lib/utils/errors';
import { getHabitLogsByDate } from '@/lib/db/queries/habits';

export async function GET(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return unauthorizedError();

    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date') ?? new Date().toISOString().slice(0, 10);

    const logs = await getHabitLogsByDate(user.id, date);
    return Response.json({ logs });
  } catch (err) {
    console.error('[GET /api/habits/logs]', err);
    return serverError();
  }
}
