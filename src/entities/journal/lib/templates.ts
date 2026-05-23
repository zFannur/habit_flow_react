import { useTranslation } from '@/shared/lib/i18n';

const PREFS_KEY = 'journal.template';

export function getSavedReflectionTemplate(): string[] | null {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (raw) {
      return JSON.parse(raw);
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

export function useReflectionTemplate(): string[] {
  const { t } = useTranslation();
  const saved = getSavedReflectionTemplate();
  if (saved) return saved;
  return [
    t('reflectionTemplateQ1'),
    t('reflectionTemplateQ2'),
    t('reflectionTemplateQ3'),
    t('reflectionTemplateQ4'),
  ];
}
