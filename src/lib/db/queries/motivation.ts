import { db } from '../index';
import { motivationMessages } from '../schema';
import { eq, and, gt, desc } from 'drizzle-orm';
import type { InsertMotivationMessage } from '../schema';

/** Return the most recent non-expired motivation message for this user. */
export async function getValidMotivation(userId: string) {
  const rows = await db
    .select()
    .from(motivationMessages)
    .where(
      and(
        eq(motivationMessages.userId, userId),
        gt(motivationMessages.expiresAt, new Date()),
      ),
    )
    .orderBy(desc(motivationMessages.createdAt))
    .limit(1);
  return rows[0] ?? null;
}

/** Persist a freshly-generated message. */
export async function createMotivationMessage(data: InsertMotivationMessage) {
  const rows = await db.insert(motivationMessages).values(data).returning();
  return rows[0];
}
