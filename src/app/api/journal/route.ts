/**
 * GET  /api/journal?date=YYYY-MM-DD   → { entry: JournalEntry | null }
 * PUT  /api/journal?date=YYYY-MM-DD   → { entry: JournalEntry }
 *
 * PUT body: { content: string; mood?: number }
 */
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { unauthorizedError, serverError } from '@/lib/utils/errors';
import { getJournalEntry, upsertJournalEntry } from '@/lib/db/queries/journal';

const putSchema = z.object({
  content: z.string().max(50_000),
  mood:    z.number().int().min(1).max(5).optional(),
});

function wordCount(text: string): number {
  return text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
}

export async function GET(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return unauthorizedError();

    const date = new URL(request.url).searchParams.get('date') ?? new Date().toISOString().slice(0, 10);
    const entry = await getJournalEntry(user.id, date);
    return Response.json({ entry });
  } catch (err) {
    console.error('[GET /api/journal]', err);
    return serverError();
  }
}

export async function PUT(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return unauthorizedError();

    const date = new URL(request.url).searchParams.get('date') ?? new Date().toISOString().slice(0, 10);

    let body: unknown;
    try { body = await request.json(); } catch { return Response.json({ error: 'Invalid JSON' }, { status: 400 }); }
    const parsed = putSchema.safeParse(body);
    if (!parsed.success) return Response.json({ error: 'Invalid payload' }, { status: 400 });

    const { content, mood } = parsed.data;
    const entry = await upsertJournalEntry({
      userId:    user.id,
      entryDate: date,
      content,
      wordCount: wordCount(content),
      mood,
    });

    return Response.json({ entry });
  } catch (err) {
    console.error('[PUT /api/journal]', err);
    return serverError();
  }
}
