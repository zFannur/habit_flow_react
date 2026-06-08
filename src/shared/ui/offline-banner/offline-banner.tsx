import { useSyncExternalStore } from 'react';
import { WifiOff } from 'lucide-react';
import { useTranslation } from '@/shared/lib/i18n';

function subscribe(callback: () => void): () => void {
  window.addEventListener('online', callback);
  window.addEventListener('offline', callback);
  return () => {
    window.removeEventListener('online', callback);
    window.removeEventListener('offline', callback);
  };
}

/**
 * Тонкий баннер «нет соединения», видимый пока браузер сообщает `offline`.
 * Telegram Mini App не имеет background API, поэтому это лёгкий feedback на
 * потерю сети вместо молчаливых падений запросов.
 */
export function OfflineBanner() {
  const online = useSyncExternalStore(
    subscribe,
    () => navigator.onLine,
    () => true,
  );
  const { t } = useTranslation();

  if (online) return null;

  return (
    <div className="fixed top-0 inset-x-0 z-50 flex items-center justify-center gap-2 bg-hf-danger text-white text-[13px] font-medium py-1.5 pt-tg-safe-top">
      <WifiOff className="w-4 h-4" />
      <span>{t('offlineBanner')}</span>
    </div>
  );
}
