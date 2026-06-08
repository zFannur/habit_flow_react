import { miniApp } from '@telegram-apps/sdk-react';

/**
 * Текущая тема Telegram (`miniApp.isDark`) как boolean, либо `null` вне реальной
 * Mini App сессии (тогда приложение откатывается на браузерный
 * `prefers-color-scheme`). Доступно после `miniApp.mount()` в bootstrap.
 */
export function getTelegramIsDark(): boolean | null {
  try {
    const dark = miniApp.isDark();
    return typeof dark === 'boolean' ? dark : null;
  } catch {
    return null;
  }
}

/**
 * Подписка на смену темы в Telegram (пользователь переключил light/dark в самом
 * Telegram). Возвращает функцию отписки; вне Telegram — no-op.
 */
export function subscribeTelegramTheme(listener: () => void): () => void {
  try {
    return miniApp.isDark.sub(listener);
  } catch {
    return () => {};
  }
}
