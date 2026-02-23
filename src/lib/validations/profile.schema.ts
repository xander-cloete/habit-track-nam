import { z } from 'zod';

export const updateProfileSchema = z.object({
  displayName: z.string().min(1).max(60).trim().optional(),
  timezone: z.string().min(1).max(60).optional(),
  wakeTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  sleepTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  weekStartDay: z.number().min(0).max(1).int().optional(),
  motivationStyle: z.enum(['gentle', 'balanced', 'direct']).optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
