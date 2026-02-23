import { db } from '../index';
import { journalEntries } from '../schema';
import { eq, and, gte, lte, desc } from 'drizzle-orm';
import type { InsertJournalEntry } from '../schema';

/** Return the entry for a specific date, or null if none exists. */
export async function getJournalEntry(userId: string, entryDate: string) {
  const rows = await db
    .select()
    .from(journalEntries)
    .where(and(eq(journalEntries.userId, userId), eq(journalEntries.entryDate, entryDate)))
    .limit(1);
  return rows[0] ?? null;
}

/** Upsert (create-or-update) a journal entry. */
export async function upsertJournalEntry(data: InsertJournalEntry) {
  const rows = await db
    .insert(journalEntries)
    .values(data)
    .onConflictDoUpdate({
      target: [journalEntries.userId, journalEntries.entryDate],
      set: {
        content:   data.content,
        wordCount: data.wordCount,
        mood:      data.mood,
        updatedAt: new Date(),
      },
    })
    .returning();
  return rows[0]!;
}

/** Return all dates (YYYY-MM-DD strings) that have an entry in a date range. */
export async function getJournalDatesInRange(userId: string, from: string, to: string) {
  const rows = await db
    .select({ entryDate: journalEntries.entryDate })
    .from(journalEntries)
    .where(
      and(
        eq(journalEntries.userId, userId),
        gte(journalEntries.entryDate, from),
        lte(journalEntries.entryDate, to),
      ),
    )
    .orderBy(desc(journalEntries.entryDate));
  return rows.map((r) => r.entryDate as string);
}

/** Return the most recent N entries (for streaks / history). */
export async function getRecentJournalEntries(userId: string, limit = 30) {
  return db
    .select()
    .from(journalEntries)
    .where(eq(journalEntries.userId, userId))
    .orderBy(desc(journalEntries.entryDate))
    .limit(limit);
}
