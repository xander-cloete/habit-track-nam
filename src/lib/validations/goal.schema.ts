import { z } from 'zod';

export const createGoalSchema = z.object({
  title: z.string().min(1).max(200).trim(),
  description: z.string().max(1000).trim().optional(),
  timeframe: z.enum(['yearly', 'monthly', 'weekly', 'daily']),
  targetDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  parentGoalId: z.string().uuid().optional(),
  lifeAreaId: z.string().uuid().optional(),
  sortOrder: z.number().int().min(0).optional(),
});

export const updateGoalSchema = createGoalSchema.partial().extend({
  status: z.enum(['active', 'completed', 'paused', 'archived']).optional(),
  progressPct: z.number().min(0).max(100).int().optional(),
});

export const createMilestoneSchema = z.object({
  title: z.string().min(1).max(200).trim(),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  sortOrder: z.number().int().min(0).optional(),
});

export type CreateGoalInput = z.infer<typeof createGoalSchema>;
export type UpdateGoalInput = z.infer<typeof updateGoalSchema>;
export type CreateMilestoneInput = z.infer<typeof createMilestoneSchema>;
