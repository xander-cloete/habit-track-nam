'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { CreateScheduleBlockInput, UpdateScheduleBlockInput } from '@/lib/validations/schedule.schema';

export const scheduleKeys = {
  all: ['schedule'] as const,
  range: (from: string, to: string) => [...scheduleKeys.all, from, to] as const,
};

export function useSchedule(from: string, to: string) {
  return useQuery({
    queryKey: scheduleKeys.range(from, to),
    queryFn: async () => {
      const res = await fetch(`/api/schedule?from=${from}&to=${to}`);
      if (!res.ok) throw new Error('Failed to fetch schedule');
      return res.json();
    },
    select: (data) => data.blocks,
    enabled: !!from && !!to,
  });
}

export function useCreateBlock() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateScheduleBlockInput) => {
      const res = await fetch('/api/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      if (!res.ok) throw new Error('Failed to create block');
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: scheduleKeys.all }),
  });
}

export function useUpdateBlock(blockId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: UpdateScheduleBlockInput) => {
      const res = await fetch(`/api/schedule/${blockId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      if (!res.ok) throw new Error('Failed to update block');
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: scheduleKeys.all }),
  });
}

export function useDeleteBlock() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (blockId: string) => {
      const res = await fetch(`/api/schedule/${blockId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete block');
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: scheduleKeys.all }),
  });
}
