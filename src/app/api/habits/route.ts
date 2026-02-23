import { createSupabaseServerClient } from '@/lib/supabase/server';
import { unauthorizedError, validationError, serverError } from '@/lib/utils/errors';
import { createHabitSchema } from '@/lib/validations/habit.schema';
import { getHabitsByUser, createHabit } from '@/lib/db/queries/habits';

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return unauthorizedError();

    const habits = await getHabitsByUser(user.id);
    return Response.json({ habits });
  } catch (err) {
    console.error('[GET /api/habits]', err);
    return serverError();
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return unauthorizedError();

    const body = await request.json();
    const parsed = createHabitSchema.safeParse(body);
    if (!parsed.success) {
      return validationError(parsed.error.issues[0].message);
    }

    const habit = await createHabit({
      ...parsed.data,
      userId: user.id,
    });

    return Response.json({ habit }, { status: 201 });
  } catch (err) {
    console.error('[POST /api/habits]', err);
    return serverError();
  }
}
