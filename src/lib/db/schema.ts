import {
  pgTable,
  uuid,
  text,
  integer,
  boolean,
  timestamp,
  date,
  jsonb,
  unique,
  index,
} from 'drizzle-orm/pg-core';
import type { AnyPgColumn } from 'drizzle-orm/pg-core';

// ─────────────────────────────────────────────
// USER PROFILES
// 1-to-1 extension of Supabase auth.users
// ─────────────────────────────────────────────
export const usersProfiles = pgTable('users_profiles', {
  id: uuid('id').primaryKey(), // matches auth.users.id
  displayName: text('display_name').notNull(),
  timezone: text('timezone').notNull().default('UTC'),
  avatarUrl: text('avatar_url'),
  onboardingCompletedAt: timestamp('onboarding_completed_at'),
  wakeTime: text('wake_time').notNull().default('07:00'),   // HH:MM
  sleepTime: text('sleep_time').notNull().default('23:00'),  // HH:MM
  weekStartDay: integer('week_start_day').notNull().default(1), // 0=Sun, 1=Mon
  motivationStyle: text('motivation_style').notNull().default('balanced'), // gentle|balanced|direct
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ─────────────────────────────────────────────
// ONBOARDING RESPONSES
// Raw quiz answers per step — used for AI context & re-processing
// ─────────────────────────────────────────────
export const onboardingResponses = pgTable(
  'onboarding_responses',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => usersProfiles.id, { onDelete: 'cascade' }),
    step: integer('step').notNull(),
    questionKey: text('question_key').notNull(),
    responseData: jsonb('response_data').notNull(), // flexible per step
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    index('onboarding_user_step_idx').on(table.userId, table.step),
  ]
);

// ─────────────────────────────────────────────
// LIFE AREAS
// The life domains the user tracks (Health, Career, Relationships, etc.)
// ─────────────────────────────────────────────
export const lifeAreas = pgTable(
  'life_areas',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => usersProfiles.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    icon: text('icon'),          // emoji or icon key
    color: text('color'),        // hex color for UI
    currentTimeAllocationPct: integer('current_time_allocation_pct'), // 0-100
    targetTimeAllocationPct: integer('target_time_allocation_pct'),   // 0-100
    sortOrder: integer('sort_order').notNull().default(0),
    isDefault: boolean('is_default').notNull().default(false),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    index('life_areas_user_idx').on(table.userId),
  ]
);

// ─────────────────────────────────────────────
// GOALS
// Self-referencing hierarchical goals: yearly → monthly → weekly → daily
// ─────────────────────────────────────────────
export const goals = pgTable(
  'goals',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => usersProfiles.id, { onDelete: 'cascade' }),
    parentGoalId: uuid('parent_goal_id').references(
      (): AnyPgColumn => goals.id,
      { onDelete: 'set null' }
    ),
    lifeAreaId: uuid('life_area_id').references(
      () => lifeAreas.id,
      { onDelete: 'set null' }
    ),
    title: text('title').notNull(),
    description: text('description'),
    timeframe: text('timeframe').notNull(), // yearly|monthly|weekly|daily
    targetDate: date('target_date'),
    status: text('status').notNull().default('active'), // active|completed|paused|archived
    progressPct: integer('progress_pct').notNull().default(0), // 0-100
    aiGenerated: boolean('ai_generated').notNull().default(false),
    sortOrder: integer('sort_order').notNull().default(0),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    index('goals_user_idx').on(table.userId),
    index('goals_user_timeframe_idx').on(table.userId, table.timeframe),
    index('goals_parent_idx').on(table.parentGoalId),
  ]
);

// ─────────────────────────────────────────────
// GOAL MILESTONES
// AI-generated or user-created actionable steps within a goal
// ─────────────────────────────────────────────
export const goalMilestones = pgTable(
  'goal_milestones',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    goalId: uuid('goal_id')
      .notNull()
      .references(() => goals.id, { onDelete: 'cascade' }),
    userId: uuid('user_id') // denormalized for efficient RLS
      .notNull()
      .references(() => usersProfiles.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    dueDate: date('due_date'),
    completedAt: timestamp('completed_at'),
    sortOrder: integer('sort_order').notNull().default(0),
    aiGenerated: boolean('ai_generated').notNull().default(false),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    index('goal_milestones_goal_idx').on(table.goalId),
    index('goal_milestones_user_idx').on(table.userId),
  ]
);

// ─────────────────────────────────────────────
// HABITS
// Core habit definitions (what the user tracks)
// ─────────────────────────────────────────────
export const habits = pgTable(
  'habits',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => usersProfiles.id, { onDelete: 'cascade' }),
    lifeAreaId: uuid('life_area_id').references(
      () => lifeAreas.id,
      { onDelete: 'set null' }
    ),
    goalId: uuid('goal_id').references(
      () => goals.id,
      { onDelete: 'set null' }
    ),
    title: text('title').notNull(),
    description: text('description'),
    icon: text('icon'),
    color: text('color'),
    frequency: text('frequency').notNull(), // daily|weekly|monthly|custom
    frequencyConfig: jsonb('frequency_config'),
    // e.g. weekly: { daysOfWeek: [1,3,5] }
    // e.g. custom: { every: 2, unit: 'days' }
    targetCount: integer('target_count').notNull().default(1), // completions per period
    reminderTime: text('reminder_time'), // HH:MM
    isActive: boolean('is_active').notNull().default(true),
    aiGenerated: boolean('ai_generated').notNull().default(false),
    sortOrder: integer('sort_order').notNull().default(0),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
    archivedAt: timestamp('archived_at'), // soft delete
  },
  (table) => [
    index('habits_user_idx').on(table.userId),
    index('habits_user_active_idx').on(table.userId, table.isActive),
    index('habits_life_area_idx').on(table.lifeAreaId),
    index('habits_goal_idx').on(table.goalId),
  ]
);

// ─────────────────────────────────────────────
// HABIT LOGS
// Each completion (or skip) of a habit on a given date
// Uses date type to avoid timezone shift bugs
// ─────────────────────────────────────────────
export const habitLogs = pgTable(
  'habit_logs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    habitId: uuid('habit_id')
      .notNull()
      .references(() => habits.id, { onDelete: 'cascade' }),
    userId: uuid('user_id') // denormalized for efficient RLS
      .notNull()
      .references(() => usersProfiles.id, { onDelete: 'cascade' }),
    logDate: date('log_date').notNull(),      // YYYY-MM-DD (user local date)
    completedAt: timestamp('completed_at'),   // exact timestamp when marked done
    status: text('status').notNull().default('completed'), // completed|skipped|partial
    count: integer('count').notNull().default(1),          // for countable habits
    note: text('note'),
    mood: integer('mood'), // 1-5 optional mood rating
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    unique('habit_logs_habit_date_uniq').on(table.habitId, table.logDate),
    index('habit_logs_user_date_idx').on(table.userId, table.logDate),
    index('habit_logs_habit_date_idx').on(table.habitId, table.logDate),
  ]
);

// ─────────────────────────────────────────────
// SCHEDULE BLOCKS
// Time-blocked entries in the daily/weekly schedule
// ─────────────────────────────────────────────
export const scheduleBlocks = pgTable(
  'schedule_blocks',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => usersProfiles.id, { onDelete: 'cascade' }),
    habitId: uuid('habit_id').references(
      () => habits.id,
      { onDelete: 'set null' }
    ),
    goalId: uuid('goal_id').references(
      () => goals.id,
      { onDelete: 'set null' }
    ),
    title: text('title').notNull(),
    description: text('description'),
    blockDate: date('block_date').notNull(),  // YYYY-MM-DD
    startTime: text('start_time').notNull(),  // HH:MM
    endTime: text('end_time').notNull(),      // HH:MM
    category: text('category'),              // habit|work|rest|social|personal|learning
    color: text('color'),
    isRecurring: boolean('is_recurring').notNull().default(false),
    recurringConfig: jsonb('recurring_config'),
    recurrenceParentId: uuid('recurrence_parent_id'), // links recurring instances
    completedAt: timestamp('completed_at'),
    aiGenerated: boolean('ai_generated').notNull().default(false),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    index('schedule_blocks_user_date_idx').on(table.userId, table.blockDate),
    index('schedule_blocks_user_date_time_idx').on(
      table.userId,
      table.blockDate,
      table.startTime
    ),
  ]
);

// ─────────────────────────────────────────────
// REPORTS
// Generated weekly and monthly reports (stored JSON + AI narrative)
// ─────────────────────────────────────────────
export const reports = pgTable(
  'reports',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => usersProfiles.id, { onDelete: 'cascade' }),
    reportType: text('report_type').notNull(), // weekly|monthly
    periodStart: date('period_start').notNull(),
    periodEnd: date('period_end').notNull(),
    status: text('status').notNull().default('pending'), // pending|generating|completed|failed
    metricsData: jsonb('metrics_data'),      // raw computed stats
    narrativeText: text('narrative_text'),    // AI-written narrative
    insightsData: jsonb('insights_data'),     // AI-extracted insights array
    createdAt: timestamp('created_at').defaultNow().notNull(),
    generatedAt: timestamp('generated_at'),
  },
  (table) => [
    unique('reports_user_type_period_uniq').on(
      table.userId,
      table.reportType,
      table.periodStart
    ),
    index('reports_user_type_date_idx').on(
      table.userId,
      table.reportType,
      table.periodStart
    ),
  ]
);

// ─────────────────────────────────────────────
// MOTIVATION MESSAGES
// Cached AI-generated motivation, expires daily at user midnight
// ─────────────────────────────────────────────
export const motivationMessages = pgTable(
  'motivation_messages',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => usersProfiles.id, { onDelete: 'cascade' }),
    messageText: text('message_text').notNull(),
    contextSnapshot: jsonb('context_snapshot'), // what triggered this message
    displayedAt: timestamp('displayed_at'),
    expiresAt: timestamp('expires_at').notNull(), // expire at user local midnight
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    index('motivation_user_expires_idx').on(table.userId, table.expiresAt),
  ]
);

// ─────────────────────────────────────────────
// JOURNAL ENTRIES
// One entry per user per day — free-form text written on "lined paper"
// ─────────────────────────────────────────────
export const journalEntries = pgTable(
  'journal_entries',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => usersProfiles.id, { onDelete: 'cascade' }),
    entryDate: date('entry_date').notNull(),   // YYYY-MM-DD (user local date)
    content: text('content').notNull().default(''),
    wordCount: integer('word_count').notNull().default(0),
    mood: integer('mood'),                     // 1-5 optional mood rating
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    unique('journal_entries_user_date_uniq').on(table.userId, table.entryDate),
    index('journal_entries_user_idx').on(table.userId),
    index('journal_entries_user_date_idx').on(table.userId, table.entryDate),
  ]
);

// ─────────────────────────────────────────────
// TYPE EXPORTS
// Infer TypeScript types directly from the schema
// ─────────────────────────────────────────────
export type UserProfile = typeof usersProfiles.$inferSelect;
export type InsertUserProfile = typeof usersProfiles.$inferInsert;

export type OnboardingResponse = typeof onboardingResponses.$inferSelect;
export type InsertOnboardingResponse = typeof onboardingResponses.$inferInsert;

export type LifeArea = typeof lifeAreas.$inferSelect;
export type InsertLifeArea = typeof lifeAreas.$inferInsert;

export type Goal = typeof goals.$inferSelect;
export type InsertGoal = typeof goals.$inferInsert;

export type GoalMilestone = typeof goalMilestones.$inferSelect;
export type InsertGoalMilestone = typeof goalMilestones.$inferInsert;

export type Habit = typeof habits.$inferSelect;
export type InsertHabit = typeof habits.$inferInsert;

export type HabitLog = typeof habitLogs.$inferSelect;
export type InsertHabitLog = typeof habitLogs.$inferInsert;

export type ScheduleBlock = typeof scheduleBlocks.$inferSelect;
export type InsertScheduleBlock = typeof scheduleBlocks.$inferInsert;

export type Report = typeof reports.$inferSelect;
export type InsertReport = typeof reports.$inferInsert;

export type MotivationMessage = typeof motivationMessages.$inferSelect;
export type InsertMotivationMessage = typeof motivationMessages.$inferInsert;

export type JournalEntry = typeof journalEntries.$inferSelect;
export type InsertJournalEntry = typeof journalEntries.$inferInsert;
