'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { HabitLog } from '@/lib/db/schema';

// Shared query key so HabitGrid + XMarkButton can all invalidate the same cache
export const todayLogsKey = (date: string) => ['habits', 'today-logs', date] as const;

async function fetchTodayLogs(date: string): Promise<HabitLog[]> {
  const res = await fetch(`/api/habits/logs?date=${date}`);
  if (!res.ok) throw new Error('Failed to fetch today logs');
  const data = (await res.json()) as { logs: HabitLog[] };
  return data.logs;
}

export function useTodayLogs(date: string) {
  return useQuery({
    queryKey: todayLogsKey(date),
    queryFn: () => fetchTodayLogs(date),
    staleTime: 30_000, // 30 s — frequent enough for interactive X-marks
  });
}

// Toggle helpers used by XMarkButton

interface LogHabitArgs {
  habitId: string;
}

export function useLogHabitForDate(date: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ habitId }: LogHabitArgs) => {
      const res = await fetch(`/api/habits/${habitId}/logs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          logDate: date,
          status: 'completed',
        }),
      });
      if (!res.ok) throw new Error('Failed to log habit');
      return (await res.json()) as { log: HabitLog };
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: todayLogsKey(date) });
    },
  });
}

export function useUnlogHabitForDate(date: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ habitId }: LogHabitArgs) => {
      const res = await fetch(`/api/habits/${habitId}/logs?date=${date}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to unlog habit');
      return (await res.json()) as { success: boolean };
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: todayLogsKey(date) });
    },
  });
}
