import { Env } from '@/shared/config';
import { supabase } from '@/shared/api';
import type { AuthUser } from '../model/types';

const ENDPOINT = `${Env.supabaseUrl}/functions/v1/auth_telegram`;

export async function signInWithTelegram(initData: string): Promise<{ jwt: string; user: AuthUser }> {
  const response = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': Env.supabaseAnonKey,
      'Authorization': `Bearer ${Env.supabaseAnonKey}`,
    },
    body: JSON.stringify({ initData }),
  });

  if (!response.ok) {
    throw new Error(`auth_telegram failed with status ${response.status}`);
  }

  const data = await response.json();
  if (!data.jwt || !data.user) {
    throw new Error('auth_telegram returned malformed payload');
  }

  return {
    jwt: data.jwt,
    user: data.user,
  };
}

export async function syncTimeZone(userId: string): Promise<void> {
  if (!userId) return;
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  if (!tz) return;

  try {
    await supabase
      .from('users')
      .update({ timezone: tz })
      .eq('id', userId)
      .neq('timezone', tz);
  } catch (e) {
    console.error('Failed to sync timezone:', e);
  }
}
