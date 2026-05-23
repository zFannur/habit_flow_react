import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchJournalEntries,
  fetchJournalEntryByDate,
  upsertJournalEntry,
  deleteJournalEntry,
  fetchJournalEntryCount,
  subscribeToJournal,
  unsubscribeFromJournal,
} from './api';
import type { JournalEntryModel } from '../model/types';

export function useJournalEntriesQuery(userId?: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['journal_entries', userId],
    queryFn: () => fetchJournalEntries(userId!),
    enabled: !!userId,
  });

  useEffect(() => {
    if (!userId) return;

    const subscription = subscribeToJournal(userId, () => {
      queryClient.invalidateQueries({ queryKey: ['journal_entries', userId] });
    });

    return () => {
      unsubscribeFromJournal(subscription);
    };
  }, [userId, queryClient]);

  return query;
}

export function useJournalEntryByDateQuery(userId?: string, dateStr?: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['journal_entry', userId, dateStr],
    queryFn: () => fetchJournalEntryByDate(userId!, dateStr!),
    enabled: !!userId && !!dateStr,
  });

  useEffect(() => {
    if (!userId || !dateStr) return;

    const subscription = subscribeToJournal(userId, () => {
      queryClient.invalidateQueries({ queryKey: ['journal_entry', userId, dateStr] });
    });

    return () => {
      unsubscribeFromJournal(subscription);
    };
  }, [userId, dateStr, queryClient]);

  return query;
}

export function useJournalEntryCountQuery(userId?: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['journal_entry_count', userId],
    queryFn: () => fetchJournalEntryCount(userId!),
    enabled: !!userId,
  });

  useEffect(() => {
    if (!userId) return;

    const subscription = subscribeToJournal(userId, () => {
      queryClient.invalidateQueries({ queryKey: ['journal_entry_count', userId] });
    });

    return () => {
      unsubscribeFromJournal(subscription);
    };
  }, [userId, queryClient]);

  return query;
}

export function useUpsertJournalEntryMutation(userId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (entry: Omit<JournalEntryModel, 'id' | 'user_id' | 'created_at' | 'updated_at'> & { id?: string }) =>
      upsertJournalEntry(userId, entry),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['journal_entries', userId] });
      queryClient.invalidateQueries({ queryKey: ['journal_entry', userId, data.entry_date] });
      queryClient.invalidateQueries({ queryKey: ['journal_entry_count', userId] });
    },
  });
}

export function useDeleteJournalEntryMutation(userId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (vars: { id: string; dateStr: string }) =>
      deleteJournalEntry(userId, vars.id),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['journal_entries', userId] });
      queryClient.invalidateQueries({ queryKey: ['journal_entry', userId, variables.dateStr] });
      queryClient.invalidateQueries({ queryKey: ['journal_entry_count', userId] });
    },
  });
}
