import { createSupabaseServerClient } from '@/lib/supabase/server';
import { unauthorizedError, notFoundError, validationError, serverError } from '@/lib/utils/errors';
import { updateScheduleBlockSchema } from '@/lib/validations/schedule.schema';
import { getScheduleBlockById, updateScheduleBlock, deleteScheduleBlock } from '@/lib/db/queries/schedule';

interface Params { params: Promise<{ blockId: string }> }

export async function PATCH(request: Request, { params }: Params) {
  try {
    const { blockId } = await params;
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return unauthorizedError();

    const body = await request.json();
    const parsed = updateScheduleBlockSchema.safeParse(body);
    if (!parsed.success) return validationError(parsed.error.issues[0].message);

    const { completedAt, ...rest } = parsed.data;
    const updateData = {
      ...rest,
      ...(completedAt !== undefined
        ? { completedAt: completedAt ? new Date(completedAt) : null }
        : {}),
    };

    const block = await updateScheduleBlock(blockId, user.id, updateData);
    if (!block) return notFoundError('Schedule block');

    return Response.json({ block });
  } catch (err) {
    console.error('[PATCH /api/schedule/:id]', err);
    return serverError();
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  try {
    const { blockId } = await params;
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return unauthorizedError();

    const block = await getScheduleBlockById(blockId, user.id);
    if (!block) return notFoundError('Schedule block');

    await deleteScheduleBlock(blockId, user.id);
    return Response.json({ success: true });
  } catch (err) {
    console.error('[DELETE /api/schedule/:id]', err);
    return serverError();
  }
}
