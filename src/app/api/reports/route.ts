import { createSupabaseServerClient } from '@/lib/supabase/server';
import { unauthorizedError, serverError } from '@/lib/utils/errors';
import { getReportsByUser } from '@/lib/db/queries/reports';

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return unauthorizedError();

    const reportList = await getReportsByUser(user.id);
    return Response.json({ reports: reportList });
  } catch (err) {
    console.error('[GET /api/reports]', err);
    return serverError();
  }
}
