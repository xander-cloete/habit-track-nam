import { db } from '../index';
import { usersProfiles } from '../schema';
import { eq } from 'drizzle-orm';
import type { InsertUserProfile } from '../schema';

export async function getUserProfile(userId: string) {
  const rows = await db
    .select()
    .from(usersProfiles)
    .where(eq(usersProfiles.id, userId))
    .limit(1);
  return rows[0] ?? null;
}

export async function upsertUserProfile(data: InsertUserProfile) {
  const rows = await db
    .insert(usersProfiles)
    .values(data)
    .onConflictDoUpdate({
      target: usersProfiles.id,
      set: {
        displayName: data.displayName,
        timezone: data.timezone,
        updatedAt: new Date(),
      },
    })
    .returning();
  return rows[0];
}

export async function updateUserProfile(
  userId: string,
  data: Partial<Omit<InsertUserProfile, 'id'>>
) {
  const rows = await db
    .update(usersProfiles)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(usersProfiles.id, userId))
    .returning();
  return rows[0] ?? null;
}
