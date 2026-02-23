import { createSupabaseServerClient } from '@/lib/supabase/server';
import { unauthorizedError, validationError, serverError, notFoundError } from '@/lib/utils/errors';
import { logHabitSchema } from '@/lib/validations/habit.schema';
import { getHabitLogs, upsertHabitLog, deleteHabitLog } from '@/lib/db/queries/habits';

interface Params { params: Promise<{ habitId: string }> }

export async function GET(request: Request, { params }: Params) {
  try {
    const { habitId } = await params;
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return unauthorizedError();

    const { searchParams } = new URL(request.url);
    const from = searchParams.get('from') ?? undefined;
    const to = searchParams.get('to') ?? undefined;

    const logs = await getHabitLogs(habitId, user.id, from, to);
    return Response.json({ logs });
  } catch (err) {
    console.error('[GET /api/habits/:id/logs]', err);
    return serverError();
  }
}

export async function POST(request: Request, { params }: Params) {
  try {
    const { habitId } = await params;
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return unauthorizedError();

    const body = await request.json();
    const parsed = logHabitSchema.safeParse(body);
    if (!parsed.success) return validationError(parsed.error.issues[0].message);

    const log = await upsertHabitLog({
      ...parsed.data,
      habitId,
      userId: user.id,
      completedAt: parsed.data.status === 'completed' ? new Date() : null,
    });

    return Response.json({ log }, { status: 201 });
  } catch (err) {
    console.error('[POST /api/habits/:id/logs]', err);
    return serverError();
  }
}

// DELETE /api/habits/:habitId/logs?date=YYYY-MM-DD
// Removes the completion log for the given habit + date (unchecks the X-mark).
export async function DELETE(request: Request, { params }: Params) {
  try {
    const { habitId } = await params;
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return unauthorizedError();

    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    if (!date) return validationError('date query param required (YYYY-MM-DD)');

    const deleted = await deleteHabitLog(habitId, date, user.id);
    if (!deleted) return notFoundError('Log not found');

    return Response.json({ success: true });
  } catch (err) {
    console.error('[DELETE /api/habits/:id/logs]', err);
    return serverError();
  }
}
