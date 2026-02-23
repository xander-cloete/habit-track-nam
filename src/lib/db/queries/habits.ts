import { db } from '../index';
import { habits, habitLogs } from '../schema';
import { eq, and, desc, gte, lte, isNull } from 'drizzle-orm';
import type { InsertHabit, InsertHabitLog } from '../schema';

export async function getHabitsByUser(userId: string) {
  return db
    .select()
    .from(habits)
    .where(and(eq(habits.userId, userId), isNull(habits.archivedAt)))
    .orderBy(habits.sortOrder, habits.createdAt);
}

export async function getHabitById(habitId: string, userId: string) {
  const rows = await db
    .select()
    .from(habits)
    .where(and(eq(habits.id, habitId), eq(habits.userId, userId)))
    .limit(1);
  return rows[0] ?? null;
}

export async function createHabit(data: InsertHabit) {
  const rows = await db.insert(habits).values(data).returning();
  return rows[0];
}

export async function updateHabit(
  habitId: string,
  userId: string,
  data: Partial<InsertHabit>
) {
  const rows = await db
    .update(habits)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(habits.id, habitId), eq(habits.userId, userId)))
    .returning();
  return rows[0] ?? null;
}

export async function archiveHabit(habitId: string, userId: string) {
  const rows = await db
    .update(habits)
    .set({ archivedAt: new Date(), isActive: false, updatedAt: new Date() })
    .where(and(eq(habits.id, habitId), eq(habits.userId, userId)))
    .returning();
  return rows[0] ?? null;
}

export async function getHabitLogs(
  habitId: string,
  userId: string,
  from?: string,
  to?: string
) {
  const conditions = [eq(habitLogs.habitId, habitId), eq(habitLogs.userId, userId)];
  if (from) conditions.push(gte(habitLogs.logDate, from));
  if (to) conditions.push(lte(habitLogs.logDate, to));

  return db
    .select()
    .from(habitLogs)
    .where(and(...conditions))
    .orderBy(desc(habitLogs.logDate));
}

export async function getHabitLogsByDate(userId: string, date: string) {
  return db
    .select()
    .from(habitLogs)
    .where(and(eq(habitLogs.userId, userId), eq(habitLogs.logDate, date)));
}

export async function upsertHabitLog(data: InsertHabitLog) {
  const rows = await db
    .insert(habitLogs)
    .values(data)
    .onConflictDoUpdate({
      target: [habitLogs.habitId, habitLogs.logDate],
      set: {
        status: data.status,
        count: data.count,
        note: data.note,
        mood: data.mood,
        completedAt: data.status === 'completed' ? new Date() : null,
      },
    })
    .returning();
  return rows[0];
}

export async function deleteHabitLog(habitId: string, logDate: string, userId: string) {
  return db
    .delete(habitLogs)
    .where(
      and(
        eq(habitLogs.habitId, habitId),
        eq(habitLogs.logDate, logDate),
        eq(habitLogs.userId, userId)
      )
    );
}
