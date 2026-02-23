import { db } from '../index';
import { goals, goalMilestones } from '../schema';
import { eq, and, isNull } from 'drizzle-orm';
import type { InsertGoal, InsertGoalMilestone } from '../schema';

export async function getGoalsByUser(userId: string, timeframe?: string) {
  const conditions = [eq(goals.userId, userId)];
  if (timeframe) {
    const { sql } = await import('drizzle-orm');
    conditions.push(sql`${goals.timeframe} = ${timeframe}`);
  }
  return db
    .select()
    .from(goals)
    .where(and(...conditions))
    .orderBy(goals.sortOrder, goals.createdAt);
}

export async function getGoalById(goalId: string, userId: string) {
  const rows = await db
    .select()
    .from(goals)
    .where(and(eq(goals.id, goalId), eq(goals.userId, userId)))
    .limit(1);
  return rows[0] ?? null;
}

export async function getMilestonesByGoal(goalId: string, userId: string) {
  return db
    .select()
    .from(goalMilestones)
    .where(and(eq(goalMilestones.goalId, goalId), eq(goalMilestones.userId, userId)))
    .orderBy(goalMilestones.sortOrder, goalMilestones.createdAt);
}

export async function createGoal(data: InsertGoal) {
  const rows = await db.insert(goals).values(data).returning();
  return rows[0];
}

export async function updateGoal(goalId: string, userId: string, data: Partial<InsertGoal>) {
  const rows = await db
    .update(goals)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(goals.id, goalId), eq(goals.userId, userId)))
    .returning();
  return rows[0] ?? null;
}

export async function deleteGoal(goalId: string, userId: string) {
  return db
    .update(goals)
    .set({ status: 'archived', updatedAt: new Date() })
    .where(and(eq(goals.id, goalId), eq(goals.userId, userId)));
}

export async function createMilestone(data: InsertGoalMilestone) {
  const rows = await db.insert(goalMilestones).values(data).returning();
  return rows[0];
}

export async function completeMilestone(milestoneId: string, userId: string) {
  const rows = await db
    .update(goalMilestones)
    .set({ completedAt: new Date() })
    .where(and(eq(goalMilestones.id, milestoneId), eq(goalMilestones.userId, userId)))
    .returning();
  return rows[0] ?? null;
}
