import { createSupabaseServerClient } from '@/lib/supabase/server';
import { unauthorizedError, validationError, serverError } from '@/lib/utils/errors';
import { createScheduleBlockSchema } from '@/lib/validations/schedule.schema';
import { getScheduleBlocks, createScheduleBlock } from '@/lib/db/queries/schedule';

export async function GET(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return unauthorizedError();

    const { searchParams } = new URL(request.url);
    const today = new Date().toISOString().split('T')[0];
    const from = searchParams.get('from') ?? today;
    const to = searchParams.get('to') ?? today;

    const blocks = await getScheduleBlocks(user.id, from, to);
    return Response.json({ blocks });
  } catch (err) {
    console.error('[GET /api/schedule]', err);
    return serverError();
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return unauthorizedError();

    const body = await request.json();
    const parsed = createScheduleBlockSchema.safeParse(body);
    if (!parsed.success) return validationError(parsed.error.issues[0].message);

    const block = await createScheduleBlock({ ...parsed.data, userId: user.id });
    return Response.json({ block }, { status: 201 });
  } catch (err) {
    console.error('[POST /api/schedule]', err);
    return serverError();
  }
}
