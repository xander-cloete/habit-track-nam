import { z } from 'zod';

const timeRegex = /^\d{2}:\d{2}$/;

export const createScheduleBlockSchema = z.object({
  title: z.string().min(1).max(100).trim(),
  description: z.string().max(500).trim().optional(),
  blockDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string().regex(timeRegex, 'Must be HH:MM'),
  endTime: z.string().regex(timeRegex, 'Must be HH:MM'),
  category: z.enum(['habit', 'work', 'rest', 'social', 'personal', 'learning']).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  habitId: z.string().uuid().optional(),
  goalId: z.string().uuid().optional(),
  isRecurring: z.boolean().default(false),
  recurringConfig: z
    .object({
      daysOfWeek: z.array(z.number().min(0).max(6)).optional(),
      every: z.number().min(1).max(30).optional(),
      unit: z.enum(['days', 'weeks']).optional(),
      endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    })
    .optional(),
});

export const updateScheduleBlockSchema = createScheduleBlockSchema.partial().extend({
  completedAt: z.string().datetime().nullable().optional(),
});

export type CreateScheduleBlockInput = z.infer<typeof createScheduleBlockSchema>;
export type UpdateScheduleBlockInput = z.infer<typeof updateScheduleBlockSchema>;
