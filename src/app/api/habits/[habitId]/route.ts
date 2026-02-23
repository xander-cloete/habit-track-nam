import { createSupabaseServerClient } from '@/lib/supabase/server';
import { unauthorizedError, notFoundError, validationError, serverError } from '@/lib/utils/errors';
import { updateHabitSchema } from '@/lib/validations/habit.schema';
import { getHabitById, updateHabit, archiveHabit } from '@/lib/db/queries/habits';

interface Params { params: Promise<{ habitId: string }> }

export async function GET(_req: Request, { params }: Params) {
  try {
    const { habitId } = await params;
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return unauthorizedError();

    const habit = await getHabitById(habitId, user.id);
    if (!habit) return notFoundError('Habit');

    return Response.json({ habit });
  } catch (err) {
    console.error('[GET /api/habits/:id]', err);
    return serverError();
  }
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    const { habitId } = await params;
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return unauthorizedError();

    const body = await request.json();
    const parsed = updateHabitSchema.safeParse(body);
    if (!parsed.success) return validationError(parsed.error.issues[0].message);

    const habit = await updateHabit(habitId, user.id, parsed.data);
    if (!habit) return notFoundError('Habit');

    return Response.json({ habit });
  } catch (err) {
    console.error('[PATCH /api/habits/:id]', err);
    return serverError();
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  try {
    const { habitId } = await params;
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return unauthorizedError();

    const habit = await archiveHabit(habitId, user.id);
    if (!habit) return notFoundError('Habit');

    return Response.json({ success: true });
  } catch (err) {
    console.error('[DELETE /api/habits/:id]', err);
    return serverError();
  }
}
