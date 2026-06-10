import { useState, useEffect } from 'react';
import { retrieveLaunchParams } from '@telegram-apps/sdk-react';
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

// Priority: localStorage → Telegram language_code → navigator.language → 'en'
const detectLocale = (): Locale => {
  // 1. Persisted user choice takes highest priority
  try {
    const saved = localStorage.getItem('app.locale');
    if (saved === 'ru' || saved === 'en') return saved;
  } catch {
    // localStorage unavailable
  }

  // 2. Telegram SDK (retrieveLaunchParams is lazy and cached internally)
  try {
    const lp = retrieveLaunchParams();
    const tgLocale = lp.tgWebAppData?.user?.language_code;
    if (tgLocale === 'ru' || tgLocale === 'en') return tgLocale;
  } catch {
    // Not inside Telegram or params not yet available — fall through
  }

  // 3. Browser language
  try {
    const browserLocale = navigator.language.split('-')[0];
    if (browserLocale === 'ru') return 'ru';
  } catch {
    // navigator.language unavailable
  }

  return 'en';
};

let currentLocale = detectLocale();
const listeners = new Set<(locale: Locale) => void>();

export const getLocale = (): Locale => currentLocale;

export const setLocale = (locale: Locale) => {
  // Persist the user's choice across restarts
  try {
    localStorage.setItem('app.locale', locale);
  } catch {
    // localStorage unavailable
  }
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
