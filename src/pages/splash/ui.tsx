import { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { retrieveRawInitData } from '@telegram-apps/sdk-react';
import { Send, Link as LinkIcon, RefreshCw, AlertCircle } from 'lucide-react';
import { useSessionStore } from '@/entities/session';
import { useTranslation } from '@/shared/lib/i18n';
import { Button } from '@/shared/ui';

/** Read Telegram initData from all available sources with fallbacks. */
function readInitData(): string {
  // Source 1: SDK retrieveRawInitData — the canonical raw initData string in v3.
  // retrieveLaunchParams().tgWebAppData is a PARSED object, not the raw string the
  // backend needs; the raw value lives behind retrieveRawInitData().
  try {
    const raw = retrieveRawInitData() ?? '';
    if (raw) {
      console.log('[Splash] initData source: SDK retrieveRawInitData ✅');
      return raw;
    }
  } catch {
    console.log('[Splash] SDK retrieveRawInitData threw — trying fallbacks');
  }

  // Source 2: window.Telegram.WebApp.initData (always available inside TG WebView)
  try {
    const tg = (window as unknown as { Telegram?: { WebApp?: { initData?: string } } }).Telegram;
    const raw = tg?.WebApp?.initData ?? '';
    if (raw) {
      console.log('[Splash] initData source: window.Telegram.WebApp ✅');
      return raw;
    }
  } catch {
    console.log('[Splash] window.Telegram.WebApp not available');
  }

  // Source 3: URL hash / search (debug / deep-link mode)
  try {
    const hash = window.location.hash.slice(1);
    const params = new URLSearchParams(hash || window.location.search);
    const raw = params.get('tgWebAppData') ?? '';
    if (raw) {
      console.log('[Splash] initData source: URL hash ✅');
      return decodeURIComponent(raw);
    }
  } catch {
    // ignore
  }

  console.log('[Splash] No initData found — not inside Telegram WebView');
  return '';
}

export default function SplashPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { state, login, restoreSession, devLogin } = useSessionStore();

  const handleBootstrap = useCallback(async () => {
    const initData = readInitData();
    console.log('[Splash] initData length:', initData.length);

    if (!initData) {
      // Outside Telegram: try restoring session from local storage
      await restoreSession();
    } else {
      // Inside Telegram: perform edge function login
      await login(initData);
    }
  }, [login, restoreSession]);

  useEffect(() => {
    handleBootstrap();
  }, [handleBootstrap]);

  // Handle redirect on successful authentication
  useEffect(() => {
    if (state.status === 'authenticated') {
      const seenOnboarding = localStorage.getItem('onboarding.seen') === 'true';
      if (seenOnboarding) {
        navigate('/today', { replace: true });
      } else {
        navigate('/onboarding', { replace: true });
      }
    }
  }, [state, navigate]);

  // Loading state
  if (state.status === 'loading' || state.status === 'authenticated') {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-hf-bg-primary text-hf-text-primary pt-tg-safe-top pb-tg-safe-bottom">
        <div className="animate-spin text-hf-accent">
          <RefreshCw className="w-8 h-8" />
        </div>
      </div>
    );
  }

  // Outside Telegram Stub
  if (state.status === 'unauthenticated') {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-hf-bg-primary text-hf-text-primary pt-tg-safe-top pb-tg-safe-bottom px-8">
        <Send className="w-16 h-16 text-hf-accent transform rotate-45 mb-6" />
        <h2 className="text-xl font-bold text-center">
          {t('splashOutsideTelegramTitle')}
        </h2>
        <p className="text-[14px] text-hf-text-secondary text-center mt-3 leading-relaxed">
          {t('splashOutsideTelegramDesc')}
        </p>
        <div className="mt-8 w-full max-w-xs flex flex-col gap-3 justify-center">
          <Button
            label={t('deviceLinkBtn')}
            icon={<LinkIcon className="w-4 h-4" />}
            onClick={() => {
              // Stub action for device link dialog
              alert('Link device feature: to be implemented');
            }}
          />
          {import.meta.env.DEV && (
            <Button
              label="Dev Bypass (Skip Auth)"
              variant="secondary"
              onClick={() => devLogin()}
            />
          )}
        </div>
      </div>
    );
  }

  // Failed state
  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-hf-bg-primary text-hf-text-primary px-8">
      <AlertCircle className="w-16 h-16 text-hf-danger mb-6 animate-pulse" />
      <h2 className="text-xl font-bold text-center">
        {t('splashAuthErrorTitle')}
      </h2>
      <p className="text-[14px] text-hf-text-secondary text-center mt-3 leading-relaxed">
        {t('splashAuthErrorDesc')}
      </p>
      <div className="mt-8 w-full max-w-xs flex justify-center">
        <Button
          label={t('commonRetry')}
          onClick={handleBootstrap}
        />
      </div>
    </div>
  );
}
