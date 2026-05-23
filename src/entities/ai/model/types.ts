export type AiStyleType = 'coach' | 'sergeant' | 'buddy' | 'sage' | 'poet';

export interface AiChatModel {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface AiMessageModel {
  id: string;
  chat_id: string;
  user_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  tokens_used?: number;
  created_at: string;
}

export interface AiSummaryModel {
  id: string;
  user_id: string;
  range_start_n: number;
  range_end_n: number;
  range_start_date: string; // YYYY-MM-DD
  range_end_date: string; // YYYY-MM-DD
  content: string;
  model_used: string;
  tokens_used?: number;
  created_at: string;
}
