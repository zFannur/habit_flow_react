import { create } from 'zustand';
import { supabase } from '@/shared/api';
import type { AuthUser, AuthState } from './types';
import { signInWithTelegram, syncTimeZone } from '../api/api';

interface SessionStore {
  state: AuthState;
  login: (initData: string) => Promise<void>;
  logout: () => Promise<void>;
  restoreSession: () => Promise<void>;
  devLogin: () => Promise<void>;
}

const JWT_KEY = 'auth.jwt';
const USER_KEY = 'auth.user';

const isJwtExpired = (jwt: string): boolean => {
  try {
    const payload = JSON.parse(atob(jwt.split('.')[1] || ''));
    if (!payload || !payload.exp) return true;
    // Current time in seconds + 10s leeway
    return Math.floor(Date.now() / 1000) > (payload.exp - 10);
  } catch {
    return true;
  }
};

export const useSessionStore = create<SessionStore>((set, get) => ({
  state: { status: 'loading' },

  login: async (initData: string) => {
    set({ state: { status: 'loading' } });
    try {
      const { jwt, user } = await signInWithTelegram(initData);
      
      // Save locally
      localStorage.setItem(JWT_KEY, jwt);
      localStorage.setItem(USER_KEY, JSON.stringify(user));

      // Apply to Supabase client
      await supabase.auth.setSession({
        access_token: jwt,
        refresh_token: '',
      });

      // Best effort timezone sync
      await syncTimeZone(user.id);

      set({ state: { status: 'authenticated', jwt, user } });
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : String(e);
      set({ state: { status: 'failed', error: errorMsg } });
    }
  },

  logout: async () => {
    localStorage.removeItem(JWT_KEY);
    localStorage.removeItem(USER_KEY);
    await supabase.auth.signOut().catch(() => {});
    set({ state: { status: 'unauthenticated' } });
  },

  restoreSession: async () => {
    try {
      const jwt = localStorage.getItem(JWT_KEY);
      const userRaw = localStorage.getItem(USER_KEY);

      if (!jwt || !userRaw) {
        set({ state: { status: 'unauthenticated' } });
        return;
      }

      if (isJwtExpired(jwt)) {
        get().logout();
        return;
      }

      const user: AuthUser = JSON.parse(userRaw);

      // Apply to Supabase client
      await supabase.auth.setSession({
        access_token: jwt,
        refresh_token: '',
      });

      // Best effort timezone sync
      await syncTimeZone(user.id);

      set({ state: { status: 'authenticated', jwt, user } });
    } catch {
      get().logout();
    }
  },

  devLogin: async () => {
    const fakeUser: AuthUser = {
      id: 'dev-user-00000000-0000-0000-0000-000000000000',
      first_name: 'Dev',
      language: 'en',
    };
    const fakeJwt = 'dev-jwt-token';
    set({ state: { status: 'authenticated', jwt: fakeJwt, user: fakeUser } });
  },
}));
