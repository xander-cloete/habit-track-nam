import { createSupabaseServerClient } from '@/lib/supabase/server';
import { unauthorizedError, notFoundError, validationError, serverError } from '@/lib/utils/errors';
import { updateGoalSchema } from '@/lib/validations/goal.schema';
import { getGoalById, getMilestonesByGoal, updateGoal, deleteGoal } from '@/lib/db/queries/goals';

interface Params { params: Promise<{ goalId: string }> }

export async function GET(_req: Request, { params }: Params) {
  try {
    const { goalId } = await params;
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return unauthorizedError();

    const goal = await getGoalById(goalId, user.id);
    if (!goal) return notFoundError('Goal');

    const milestones = await getMilestonesByGoal(goalId, user.id);
    return Response.json({ goal, milestones });
  } catch (err) {
    console.error('[GET /api/goals/:id]', err);
    return serverError();
  }
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    const { goalId } = await params;
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return unauthorizedError();

    const body = await request.json();
    const parsed = updateGoalSchema.safeParse(body);
    if (!parsed.success) return validationError(parsed.error.issues[0].message);

    const goal = await updateGoal(goalId, user.id, parsed.data);
    if (!goal) return notFoundError('Goal');

    return Response.json({ goal });
  } catch (err) {
    console.error('[PATCH /api/goals/:id]', err);
    return serverError();
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  try {
    const { goalId } = await params;
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return unauthorizedError();

    await deleteGoal(goalId, user.id);
    return Response.json({ success: true });
  } catch (err) {
    console.error('[DELETE /api/goals/:id]', err);
    return serverError();
  }
}
