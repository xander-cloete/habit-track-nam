import { z } from 'zod';

export const createHabitSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100).trim(),
  description: z.string().max(500).trim().optional(),
  icon: z.string().max(10).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  frequency: z.enum(['daily', 'weekly', 'monthly', 'custom']),
  frequencyConfig: z
    .object({
      daysOfWeek: z.array(z.number().min(0).max(6)).optional(),
      every: z.number().min(1).max(30).optional(),
      unit: z.enum(['days', 'weeks']).optional(),
    })
    .optional(),
  targetCount: z.number().min(1).max(100).default(1),
  reminderTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/, 'Must be HH:MM format')
    .optional(),
  lifeAreaId: z.string().uuid().optional(),
  goalId: z.string().uuid().optional(),
});

export const updateHabitSchema = createHabitSchema.partial().extend({
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().min(0).optional(),
});

export const logHabitSchema = z.object({
  logDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD'),
  status: z.enum(['completed', 'skipped', 'partial']).default('completed'),
  count: z.number().min(1).max(1000).default(1),
  note: z.string().max(500).trim().optional(),
  mood: z.number().min(1).max(5).int().optional(),
});

export type CreateHabitInput = z.infer<typeof createHabitSchema>;
export type UpdateHabitInput = z.infer<typeof updateHabitSchema>;
export type LogHabitInput = z.infer<typeof logHabitSchema>;
