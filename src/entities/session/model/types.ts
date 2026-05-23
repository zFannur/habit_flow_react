export interface AuthUser {
  id: string;
  telegram_user_id?: number;
  first_name?: string;
  last_name?: string;
  telegram_username?: string;
  language?: string;
}

export type AuthState =
  | { status: 'loading' }
  | { status: 'unauthenticated' }
  | { status: 'authenticated'; jwt: string; user: AuthUser }
  | { status: 'failed'; error: string };
