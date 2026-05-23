import type { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '@/shared/api';
import type { HabitModel, HabitLogModel, HabitLogStatus } from '../model/types';

// -------------------------------------------------------------------------
// Habits API
// -------------------------------------------------------------------------

export async function fetchHabits(userId: string): Promise<HabitModel[]> {
  const { data, error } = await supabase
    .from('habits')
    .select()
    .eq('user_id', userId)
    .order('position', { ascending: true });

  if (error) throw error;
  return (data || []) as HabitModel[];
}

export async function createHabit(userId: string, habit: Omit<HabitModel, 'id' | 'user_id' | 'created_at' | 'updated_at'> & { id?: string }): Promise<HabitModel> {
  const payload = {
    ...habit,
    user_id: userId,
  };

  const { data, error } = await supabase
    .from('habits')
    .insert(payload)
    .select()
    .single();

  if (error) throw error;
  return data as HabitModel;
}

export async function updateHabit(userId: string, id: string, habit: Partial<Omit<HabitModel, 'id' | 'user_id' | 'created_at' | 'updated_at'>>): Promise<HabitModel> {
  const { data, error } = await supabase
    .from('habits')
    .update(habit)
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw error;
  return data as HabitModel;
}

export async function archiveHabit(userId: string, id: string): Promise<void> {
  const { error } = await supabase
    .from('habits')
    .update({ is_archived: true })
    .eq('id', id)
    .eq('user_id', userId);

  if (error) throw error;
}

export async function deleteHabit(userId: string, id: string): Promise<void> {
  const { error } = await supabase
    .from('habits')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);

  if (error) throw error;
}

// -------------------------------------------------------------------------
// Habit Logs API
// -------------------------------------------------------------------------

export async function fetchLogsInRange(userId: string, fromDate: string, toDate: string): Promise<HabitLogModel[]> {
  const { data, error } = await supabase
    .from('habit_logs')
    .select()
    .eq('user_id', userId)
    .gte('log_date', fromDate)
    .lte('log_date', toDate)
    .order('log_date', { ascending: false });

  if (error) throw error;
  return (data || []) as HabitLogModel[];
}

export async function fetchLogsForHabit(userId: string, habitId: string): Promise<HabitLogModel[]> {
  const { data, error } = await supabase
    .from('habit_logs')
    .select()
    .eq('user_id', userId)
    .eq('habit_id', habitId)
    .order('log_date', { ascending: false });

  if (error) throw error;
  return (data || []) as HabitLogModel[];
}

export async function upsertLog(
  userId: string,
  habitId: string,
  dateStr: string,
  status: HabitLogStatus,
  value?: number,
  comment?: string
): Promise<HabitLogModel> {
  const payload = {
    user_id: userId,
    habit_id: habitId,
    log_date: dateStr,
    status,
    value,
    comment,
  };

  const { data, error } = await supabase
    .from('habit_logs')
    .upsert(payload, { onConflict: 'habit_id,log_date' })
    .select()
    .single();

  if (error) throw error;
  return data as HabitLogModel;
}

export async function deleteLog(userId: string, logId: string): Promise<void> {
  const { error } = await supabase
    .from('habit_logs')
    .delete()
    .eq('id', logId)
    .eq('user_id', userId);

  if (error) throw error;
}

// -------------------------------------------------------------------------
// Realtime Subscriptions
// -------------------------------------------------------------------------

// Channel names MUST be unique per subscriber. supabase-js dedupes channels by
// topic, so a shared name returns an already-subscribed channel and .on() throws
// "cannot add postgres_changes callbacks after subscribe()".
export function subscribeToHabits(userId: string, onChange: () => void) {
  return supabase
    .channel(`realtime:habits:${userId}:${crypto.randomUUID()}`)
    .on(
      'postgres_changes',
      { event: '*', filter: `user_id=eq.${userId}`, schema: 'public', table: 'habits' },
      () => onChange()
    )
    .subscribe();
}

export function subscribeToLogs(userId: string, onChange: () => void) {
  return supabase
    .channel(`realtime:habit_logs:${userId}:${crypto.randomUUID()}`)
    .on(
      'postgres_changes',
      { event: '*', filter: `user_id=eq.${userId}`, schema: 'public', table: 'habit_logs' },
      () => onChange()
    )
    .subscribe();
}

// removeChannel (not channel.unsubscribe) also drops the channel from the client
// registry, so repeated mount/unmount cycles don't leak channels.
export function unsubscribeFromRealtime(channel: RealtimeChannel): void {
  supabase.removeChannel(channel);
}
