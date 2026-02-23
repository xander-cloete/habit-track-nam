import { createSupabaseServerClient } from '@/lib/supabase/server';
import { unauthorizedError, notFoundError, serverError } from '@/lib/utils/errors';
import { getReportById } from '@/lib/db/queries/reports';

interface Params { params: Promise<{ reportId: string }> }

export async function GET(_req: Request, { params }: Params) {
  try {
    const { reportId } = await params;
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return unauthorizedError();

    const report = await getReportById(reportId, user.id);
    if (!report) return notFoundError('Report');

    return Response.json({ report });
  } catch (err) {
    console.error('[GET /api/reports/:id]', err);
    return serverError();
  }
}
