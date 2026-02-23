/**
 * GET /api/journal/dates?from=YYYY-MM-DD&to=YYYY-MM-DD
 * Returns dates in the range that have a journal entry.
 * Used to render calendar dots in the month view.
 *
 * Response: { dates: string[] }
 */
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { unauthorizedError, serverError } from '@/lib/utils/errors';
import { getJournalDatesInRange } from '@/lib/db/queries/journal';

export async function GET(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return unauthorizedError();

    const { searchParams } = new URL(request.url);
    const today = new Date().toISOString().slice(0, 10);
    const from  = searchParams.get('from') ?? today.slice(0, 7) + '-01'; // first of month
    const to    = searchParams.get('to')   ?? today;

    const dates = await getJournalDatesInRange(user.id, from, to);
    return Response.json({ dates });
  } catch (err) {
    console.error('[GET /api/journal/dates]', err);
    return serverError();
  }
}
