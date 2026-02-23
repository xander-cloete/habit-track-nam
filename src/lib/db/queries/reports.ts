import { db } from '../index';
import { reports } from '../schema';
import { eq, and, desc } from 'drizzle-orm';
import type { InsertReport } from '../schema';

export async function getReportsByUser(userId: string) {
  return db
    .select()
    .from(reports)
    .where(eq(reports.userId, userId))
    .orderBy(desc(reports.periodStart));
}

export async function getReportById(reportId: string, userId: string) {
  const rows = await db
    .select()
    .from(reports)
    .where(and(eq(reports.id, reportId), eq(reports.userId, userId)))
    .limit(1);
  return rows[0] ?? null;
}

export async function createReport(data: InsertReport) {
  const rows = await db.insert(reports).values(data).returning();
  return rows[0];
}

export async function updateReport(
  reportId: string,
  userId: string,
  data: Partial<InsertReport>
) {
  const rows = await db
    .update(reports)
    .set(data)
    .where(and(eq(reports.id, reportId), eq(reports.userId, userId)))
    .returning();
  return rows[0] ?? null;
}
