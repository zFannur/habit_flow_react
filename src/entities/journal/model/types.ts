export interface JournalEntryModel {
  id: string;
  user_id: string;
  entry_date: string; // YYYY-MM-DD
  free_text: string;
  mood?: number;
  energy?: number;
  answers?: Record<string, string>;
  created_at: string;
  updated_at: string;
}
