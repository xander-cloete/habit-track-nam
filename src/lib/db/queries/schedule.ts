import { db } from '../index';
import { scheduleBlocks } from '../schema';
import { eq, and, gte, lte } from 'drizzle-orm';
import type { InsertScheduleBlock } from '../schema';

export async function getScheduleBlocks(userId: string, from: string, to: string) {
  return db
    .select()
    .from(scheduleBlocks)
    .where(
      and(
        eq(scheduleBlocks.userId, userId),
        gte(scheduleBlocks.blockDate, from),
        lte(scheduleBlocks.blockDate, to)
      )
    )
    .orderBy(scheduleBlocks.blockDate, scheduleBlocks.startTime);
}

export async function getScheduleBlockById(blockId: string, userId: string) {
  const rows = await db
    .select()
    .from(scheduleBlocks)
    .where(and(eq(scheduleBlocks.id, blockId), eq(scheduleBlocks.userId, userId)))
    .limit(1);
  return rows[0] ?? null;
}

export async function createScheduleBlock(data: InsertScheduleBlock) {
  const rows = await db.insert(scheduleBlocks).values(data).returning();
  return rows[0];
}

export async function updateScheduleBlock(
  blockId: string,
  userId: string,
  data: Partial<InsertScheduleBlock>
) {
  const rows = await db
    .update(scheduleBlocks)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(scheduleBlocks.id, blockId), eq(scheduleBlocks.userId, userId)))
    .returning();
  return rows[0] ?? null;
}

export async function deleteScheduleBlock(blockId: string, userId: string) {
  return db
    .delete(scheduleBlocks)
    .where(and(eq(scheduleBlocks.id, blockId), eq(scheduleBlocks.userId, userId)));
}
