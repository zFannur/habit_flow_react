import { createClient } from '@supabase/supabase-js';
import { Env } from '@/shared/config';

export const supabase = createClient(Env.supabaseUrl, Env.supabaseAnonKey, {
  auth: {
    persistSession: true,
    // Сессия ставится внешним JWT (edge function auth_telegram) с пустым
    // refresh_token. Авто-refresh с пустым токеном только молча обнуляет сессию
    // ближе к экспирации → запросы уходят как anon и RLS режет данные. JWT мы
    // обновляем сами через login/restoreSession.
    autoRefreshToken: false,
    detectSessionInUrl: false, // Essential for Telegram Mini App to prevent hash/router conflict
  },
});
