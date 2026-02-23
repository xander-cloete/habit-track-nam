import { createSupabaseServerClient } from '@/lib/supabase/server';
import { unauthorizedError, validationError, serverError } from '@/lib/utils/errors';
import { createGoalSchema } from '@/lib/validations/goal.schema';
import { getGoalsByUser, createGoal } from '@/lib/db/queries/goals';

export async function GET(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return unauthorizedError();

    const { searchParams } = new URL(request.url);
    const timeframe = searchParams.get('timeframe') ?? undefined;

    const goalList = await getGoalsByUser(user.id, timeframe);
    return Response.json({ goals: goalList });
  } catch (err) {
    console.error('[GET /api/goals]', err);
    return serverError();
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return unauthorizedError();

    const body = await request.json();
    const parsed = createGoalSchema.safeParse(body);
    if (!parsed.success) return validationError(parsed.error.issues[0].message);

    const goal = await createGoal({ ...parsed.data, userId: user.id });
    return Response.json({ goal }, { status: 201 });
  } catch (err) {
    console.error('[POST /api/goals]', err);
    return serverError();
  }
}
