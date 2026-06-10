import { useTranslation } from '@/shared/lib/i18n';

const PREFS_KEY = 'journal.template';

/** Keys for the four built-in default questions. */
export const DEFAULT_QUESTION_KEYS = [
  'reflectionTemplateQ1',
  'reflectionTemplateQ2',
  'reflectionTemplateQ3',
  'reflectionTemplateQ4',
] as const;

export type DefaultQuestionKey = (typeof DEFAULT_QUESTION_KEYS)[number];

// Known EN and RU strings for the default questions — used for migration of
// already-saved translated strings back to their i18n keys.
const EN_DEFAULTS: Record<string, DefaultQuestionKey> = {
  'What was the highlight today?': 'reflectionTemplateQ1',
  'What are you grateful for?': 'reflectionTemplateQ2',
  'What would you do differently?': 'reflectionTemplateQ3',
  'What charged / drained you?': 'reflectionTemplateQ4',
};

const RU_DEFAULTS: Record<string, DefaultQuestionKey> = {
  'Что было главным сегодня?': 'reflectionTemplateQ1',
  'За что ты благодарен?': 'reflectionTemplateQ2',
  'Что бы сделал по-другому?': 'reflectionTemplateQ3',
  'Что зарядило / опустошило?': 'reflectionTemplateQ4',
};

/**
 * Convert a stored item to an i18n key when it matches a known default
 * translation (migration) or return it unchanged (custom question string).
 */
function migrateItem(raw: string): string {
  return EN_DEFAULTS[raw] ?? RU_DEFAULTS[raw] ?? raw;
}

export function getSavedReflectionTemplate(): string[] | null {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (raw) {
      const parsed: string[] = JSON.parse(raw);
      // Migrate any already-translated default strings → i18n keys.
      const migrated = parsed.map(migrateItem);
      return migrated;
    }
  } catch (e) {
    console.error('Failed to parse reflection template', e);
  }
  return null;
}

export function saveReflectionTemplate(questions: string[]): void {
  localStorage.setItem(PREFS_KEY, JSON.stringify(questions));
}

export function resetReflectionTemplate(): void {
  localStorage.removeItem(PREFS_KEY);
}

/**
 * Resolve a stored item: if it's a known i18n key, translate it; otherwise
 * return it as a raw custom question string.
 */
export function resolveQuestion(item: string, t: (key: string) => string): string {
  const isDefaultKey = (DEFAULT_QUESTION_KEYS as readonly string[]).includes(item);
  return isDefaultKey ? t(item) : item;
}

export function useReflectionTemplate(): { questions: string[]; rawKeys: string[] } {
  const { t } = useTranslation();
  const saved = getSavedReflectionTemplate();
  const rawKeys = saved ?? ([...DEFAULT_QUESTION_KEYS] as string[]);
  const questions = rawKeys.map((item) => resolveQuestion(item, t));
  return { questions, rawKeys };
}
