import { useState, useEffect } from 'react';
import en from './locales/en.json';
import ru from './locales/ru.json';

type Locale = 'ru' | 'en';
type Translations = Record<string, string>;

const locales: Record<Locale, Translations> = { en, ru };

declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        initDataUnsafe?: {
          user?: {
            language_code?: string;
          };
        };
        openInvoice?: (url: string, callback?: (status: string) => void) => void;
      };
    };
  }
}

// Default locale detection from Telegram user locale or fallback to browser
const detectLocale = (): Locale => {
  try {
    const tgLocale = window.Telegram?.WebApp?.initDataUnsafe?.user?.language_code;
    if (tgLocale === 'ru' || tgLocale === 'en') return tgLocale;
  } catch {
    // Ignore if not available yet
  }
  const browserLocale = navigator.language.split('-')[0];
  return browserLocale === 'ru' ? 'ru' : 'en';
};

let currentLocale = detectLocale();
const listeners = new Set<(locale: Locale) => void>();

export const getLocale = (): Locale => currentLocale;

export const setLocale = (locale: Locale) => {
  if (locale !== currentLocale) {
    currentLocale = locale;
    listeners.forEach((l) => l(locale));
  }
};

export const translate = (key: string, params?: Record<string, string | number>): string => {
  const dictionary = locales[currentLocale] || locales.en;
  const rawText = dictionary[key] ?? locales.en[key];
  if (rawText === undefined) {
    return key;
  }
  let text = rawText;
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      text = text.replace(new RegExp(`{${k}}`, 'g'), String(v));
    });
  }
  return text;
};

export const useTranslation = () => {
  const [locale, _setLocaleState] = useState<Locale>(currentLocale);

  useEffect(() => {
    const listener = (newLocale: Locale) => _setLocaleState(newLocale);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  return {
    t: translate,
    locale,
    setLocale,
  };
};
