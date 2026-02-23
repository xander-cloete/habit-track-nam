'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { CreateHabitInput, UpdateHabitInput, LogHabitInput } from '@/lib/validations/habit.schema';

// ── Query keys ────────────────────────────────────────────────────────────────
export const habitKeys = {
  all: ['habits'] as const,
  lists: () => [...habitKeys.all, 'list'] as const,
  detail: (id: string) => [...habitKeys.all, 'detail', id] as const,
  logs: (id: string, from?: string, to?: string) =>
    [...habitKeys.all, 'logs', id, from, to] as const,
};

// ── Fetch helpers ─────────────────────────────────────────────────────────────
async function fetchHabits() {
  const res = await fetch('/api/habits');
  if (!res.ok) throw new Error('Failed to fetch habits');
  return res.json();
}

async function fetchHabit(habitId: string) {
  const res = await fetch(`/api/habits/${habitId}`);
  if (!res.ok) throw new Error('Failed to fetch habit');
  return res.json();
}

async function fetchHabitLogs(habitId: string, from?: string, to?: string) {
  const params = new URLSearchParams();
  if (from) params.set('from', from);
  if (to) params.set('to', to);
  const res = await fetch(`/api/habits/${habitId}/logs?${params}`);
  if (!res.ok) throw new Error('Failed to fetch habit logs');
  return res.json();
}

// ── Hooks ─────────────────────────────────────────────────────────────────────
export function useHabits() {
  return useQuery({
    queryKey: habitKeys.lists(),
    queryFn: fetchHabits,
    select: (data) => data.habits,
  });
}

export function useHabit(habitId: string) {
  return useQuery({
    queryKey: habitKeys.detail(habitId),
    queryFn: () => fetchHabit(habitId),
    select: (data) => data.habit,
    enabled: !!habitId,
  });
}

export function useHabitLogs(habitId: string, from?: string, to?: string) {
  return useQuery({
    queryKey: habitKeys.logs(habitId, from, to),
    queryFn: () => fetchHabitLogs(habitId, from, to),
    select: (data) => data.logs,
    enabled: !!habitId,
  });
}

export function useCreateHabit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateHabitInput) => {
      const res = await fetch('/api/habits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      if (!res.ok) throw new Error('Failed to create habit');
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: habitKeys.lists() }),
  });
}

export function useUpdateHabit(habitId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: UpdateHabitInput) => {
      const res = await fetch(`/api/habits/${habitId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      if (!res.ok) throw new Error('Failed to update habit');
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: habitKeys.lists() });
      qc.invalidateQueries({ queryKey: habitKeys.detail(habitId) });
    },
  });
}

export function useDeleteHabit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (habitId: string) => {
      const res = await fetch(`/api/habits/${habitId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete habit');
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: habitKeys.lists() }),
  });
}

export function useLogHabit(habitId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: LogHabitInput) => {
      const res = await fetch(`/api/habits/${habitId}/logs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      if (!res.ok) throw new Error('Failed to log habit');
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: habitKeys.logs(habitId) });
      qc.invalidateQueries({ queryKey: habitKeys.lists() });
    },
  });
}
