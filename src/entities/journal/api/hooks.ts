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

/**
 * Single shared realtime channel for the journal entity.
 * Any change on `journal_entries` invalidates all ['journal', …] query keys.
 * Mount this once per screen that needs live sync; query hooks themselves no
 * longer create their own channels.
 */
export function useJournalRealtimeSync(userId?: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!userId) return;

    const subscription = subscribeToJournal(userId, () => {
      queryClient.invalidateQueries({ queryKey: ['journal_entries', userId] });
      queryClient.invalidateQueries({ queryKey: ['journal_entry', userId] });
      queryClient.invalidateQueries({ queryKey: ['journal_entry_count', userId] });
    });

    return () => {
      unsubscribeFromJournal(subscription);
    };
  }, [userId, queryClient]);
}

export function useJournalEntriesQuery(userId?: string) {
  return useQuery({
    queryKey: ['journal_entries', userId],
    queryFn: () => fetchJournalEntries(userId!),
    enabled: !!userId,
  });
}

export function useJournalEntryByDateQuery(userId?: string, dateStr?: string) {
  return useQuery({
    queryKey: ['journal_entry', userId, dateStr],
    queryFn: () => fetchJournalEntryByDate(userId!, dateStr!),
    enabled: !!userId && !!dateStr,
  });
}

export function useJournalEntryCountQuery(userId?: string) {
  return useQuery({
    queryKey: ['journal_entry_count', userId],
    queryFn: () => fetchJournalEntryCount(userId!),
    enabled: !!userId,
  });
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
