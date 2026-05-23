export const Env = {
  get supabaseUrl(): string {
    const value = import.meta.env.VITE_SUPABASE_URL || '';
    if (!value && import.meta.env.DEV) {
      console.warn('VITE_SUPABASE_URL is not set.');
    }
    return value;
  },

  get supabaseAnonKey(): string {
    const value = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
    if (!value && import.meta.env.DEV) {
      console.warn('VITE_SUPABASE_ANON_KEY is not set.');
    }
    return value;
  },

  get openRouterBaseUrl(): string {
    return import.meta.env.VITE_OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';
  },

  get defaultModel(): string {
    return import.meta.env.VITE_OPENROUTER_DEFAULT_MODEL || 'openai/gpt-oss-120b:free';
  },

  get environment(): string {
    return import.meta.env.VITE_ENV || import.meta.env.MODE || 'development';
  },

  get appBaseUrl(): string {
    return import.meta.env.VITE_APP_BASE_URL || 'https://habitflow.app';
  },

  get botPublicChannel(): string {
    return import.meta.env.VITE_BOT_PUBLIC_CHANNEL || 'https://t.me/habitflow_dev';
  },

  get openRouterKeysUrl(): string {
    return import.meta.env.VITE_OPENROUTER_KEYS_URL || 'https://openrouter.ai/keys';
  },

  get botUsername(): string {
    return import.meta.env.VITE_BOT_USERNAME || '';
  },

  get isProduction(): boolean {
    return this.environment === 'production';
  },

  assertValid(): void {
    if (!this.supabaseUrl) {
      throw new Error('VITE_SUPABASE_URL is required. Set it in .env file.');
    }
    if (!this.supabaseAnonKey) {
      throw new Error('VITE_SUPABASE_ANON_KEY is required. Set it in .env file.');
    }
  }
};
