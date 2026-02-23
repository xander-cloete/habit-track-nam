'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { CreateGoalInput, UpdateGoalInput } from '@/lib/validations/goal.schema';

export const goalKeys = {
  all: ['goals'] as const,
  lists: (timeframe?: string) => [...goalKeys.all, 'list', timeframe] as const,
  detail: (id: string) => [...goalKeys.all, 'detail', id] as const,
};

export function useGoals(timeframe?: string) {
  return useQuery({
    queryKey: goalKeys.lists(timeframe),
    queryFn: async () => {
      const params = timeframe ? `?timeframe=${timeframe}` : '';
      const res = await fetch(`/api/goals${params}`);
      if (!res.ok) throw new Error('Failed to fetch goals');
      return res.json();
    },
    select: (data) => data.goals,
  });
}

export function useGoal(goalId: string) {
  return useQuery({
    queryKey: goalKeys.detail(goalId),
    queryFn: async () => {
      const res = await fetch(`/api/goals/${goalId}`);
      if (!res.ok) throw new Error('Failed to fetch goal');
      return res.json();
    },
    enabled: !!goalId,
  });
}

export function useCreateGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateGoalInput) => {
      const res = await fetch('/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      if (!res.ok) throw new Error('Failed to create goal');
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: goalKeys.all }),
  });
}

export function useUpdateGoal(goalId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: UpdateGoalInput) => {
      const res = await fetch(`/api/goals/${goalId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      if (!res.ok) throw new Error('Failed to update goal');
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: goalKeys.all });
      qc.invalidateQueries({ queryKey: goalKeys.detail(goalId) });
    },
  });
}

export function useDeleteGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (goalId: string) => {
      const res = await fetch(`/api/goals/${goalId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete goal');
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: goalKeys.all }),
  });
}
