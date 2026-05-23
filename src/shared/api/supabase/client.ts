import { createClient } from '@supabase/supabase-js';
import { Env } from '@/shared/config';

export const supabase = createClient(Env.supabaseUrl, Env.supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false, // Essential for Telegram Mini App to prevent hash/router conflict
  },
});
