import { supabase } from '@/shared/api';
import type { JournalEntryModel } from '../model/types';

export async function fetchJournalEntries(userId: string): Promise<JournalEntryModel[]> {
  const { data, error } = await supabase
    .from('journal_entries')
    .select()
    .eq('user_id', userId)
    .order('entry_date', { ascending: false });

  if (error) throw error;
  return (data || []) as JournalEntryModel[];
}

export async function fetchJournalEntryByDate(userId: string, dateStr: string): Promise<JournalEntryModel | null> {
  const { data, error } = await supabase
    .from('journal_entries')
    .select()
    .eq('user_id', userId)
    .eq('entry_date', dateStr)
    .maybeSingle();

  if (error) throw error;
  return data as JournalEntryModel | null;
}

export async function upsertJournalEntry(
  userId: string,
  entry: Omit<JournalEntryModel, 'id' | 'user_id' | 'created_at' | 'updated_at'> & { id?: string }
): Promise<JournalEntryModel> {
  const payload = {
    ...entry,
    user_id: userId,
  };

  const { data, error } = await supabase
    .from('journal_entries')
    .upsert(payload, { onConflict: 'user_id,entry_date' })
    .select()
    .single();

  if (error) throw error;
  return data as JournalEntryModel;
}

export async function deleteJournalEntry(userId: string, id: string): Promise<void> {
  const { error } = await supabase
    .from('journal_entries')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);

  if (error) throw error;
}

export async function fetchJournalEntryCount(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from('journal_entries')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);

  if (error) throw error;
  return count || 0;
}

export function subscribeToJournal(userId: string, onChange: () => void) {
  return supabase
    .channel('realtime:journal_entries')
    .on(
      'postgres_changes',
      { event: '*', filter: `user_id=eq.${userId}`, schema: 'public', table: 'journal_entries' },
      () => onChange()
    )
    .subscribe();
}
