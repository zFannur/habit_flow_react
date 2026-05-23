import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchHabits,
  fetchLogsInRange,
  fetchLogsForHabit,
  createHabit,
  updateHabit,
  archiveHabit,
  deleteHabit,
  upsertLog,
  deleteLog,
  subscribeToHabits,
  subscribeToLogs,
} from './api';
import type { HabitModel, HabitLogStatus } from '../model/types';

export function useHabitsQuery(userId?: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['habits', userId],
    queryFn: () => fetchHabits(userId!),
    enabled: !!userId,
  });

  useEffect(() => {
    if (!userId) return;

    // Realtime Postgres changes trigger query invalidation
    const subscription = subscribeToHabits(userId, () => {
      queryClient.invalidateQueries({ queryKey: ['habits', userId] });
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [userId, queryClient]);

  return query;
}

export function useLogsQuery(userId?: string, fromDate?: string, toDate?: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['logs', userId, fromDate, toDate],
    queryFn: () => fetchLogsInRange(userId!, fromDate!, toDate!),
    enabled: !!userId && !!fromDate && !!toDate,
  });

  useEffect(() => {
    if (!userId) return;

    const subscription = subscribeToLogs(userId, () => {
      queryClient.invalidateQueries({ queryKey: ['logs', userId] });
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [userId, queryClient]);

  return query;
}

export function useHabitLogsQuery(userId?: string, habitId?: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['habit_logs', userId, habitId],
    queryFn: () => fetchLogsForHabit(userId!, habitId!),
    enabled: !!userId && !!habitId,
  });

  useEffect(() => {
    if (!userId || !habitId) return;

    const subscription = subscribeToLogs(userId, () => {
      queryClient.invalidateQueries({ queryKey: ['habit_logs', userId, habitId] });
      queryClient.invalidateQueries({ queryKey: ['logs', userId] }); // also invalidate today's logs query
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [userId, habitId, queryClient]);

  return query;
}

export function useCreateHabitMutation(userId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (habit: Omit<HabitModel, 'id' | 'user_id' | 'created_at' | 'updated_at'> & { id?: string }) =>
      createHabit(userId, habit),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits', userId] });
    },
  });
}

export function useUpdateHabitMutation(userId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, habit }: { id: string; habit: Partial<Omit<HabitModel, 'id' | 'user_id' | 'created_at' | 'updated_at'>> }) =>
      updateHabit(userId, id, habit),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits', userId] });
    },
  });
}

export function useArchiveHabitMutation(userId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => archiveHabit(userId, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits', userId] });
    },
  });
}

export function useDeleteHabitMutation(userId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteHabit(userId, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits', userId] });
    },
  });
}

export function useLogHabitMutation(userId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      habitId,
      dateStr,
      status,
      value,
      comment,
    }: {
      habitId: string;
      dateStr: string;
      status: HabitLogStatus;
      value?: number;
      comment?: string;
    }) => upsertLog(userId, habitId, dateStr, status, value, comment),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['logs', userId] });
    },
  });
}

export function useUndoLogMutation(userId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (logId: string) => deleteLog(userId, logId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['logs', userId] });
    },
  });
}
