import { createSupabaseServerClient } from '@/lib/supabase/server';
import { unauthorizedError, notFoundError, validationError, serverError } from '@/lib/utils/errors';
import { updateProfileSchema } from '@/lib/validations/profile.schema';
import { getUserProfile, updateUserProfile } from '@/lib/db/queries/users';

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return unauthorizedError();

    const profile = await getUserProfile(user.id);
    if (!profile) return notFoundError('Profile');

    return Response.json({ profile });
  } catch (err) {
    console.error('[GET /api/users/profile]', err);
    return serverError();
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return unauthorizedError();

    const body = await request.json();
    const parsed = updateProfileSchema.safeParse(body);
    if (!parsed.success) return validationError(parsed.error.issues[0].message);

    const profile = await updateUserProfile(user.id, parsed.data);
    if (!profile) return notFoundError('Profile');

    return Response.json({ profile });
  } catch (err) {
    console.error('[PATCH /api/users/profile]', err);
    return serverError();
  }
}
