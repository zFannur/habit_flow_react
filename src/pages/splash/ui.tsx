import { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { retrieveLaunchParams } from '@telegram-apps/sdk-react';
import { Send, Link as LinkIcon, RefreshCw, AlertCircle } from 'lucide-react';
import { useSessionStore } from '@/entities/session';
import { useTranslation } from '@/shared/lib/i18n';
import { Button } from '@/shared/ui';

export default function SplashPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { state, login, restoreSession } = useSessionStore();

  const handleBootstrap = useCallback(async () => {
    let initData = '';
    try {
      // Get initData from launch params if inside Telegram
      const lp = retrieveLaunchParams();
      initData = (lp.initDataRaw as string | undefined) || '';
    } catch {
      // Not inside Telegram Webview
    }

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
      <div className="w-full h-full flex flex-col items-center justify-center bg-tg-bg text-tg-text">
        <div className="animate-spin text-tg-accent">
          <RefreshCw className="w-8 h-8" />
        </div>
      </div>
    );
  }

  // Outside Telegram Stub
  if (state.status === 'unauthenticated') {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-tg-bg text-tg-text px-8">
        <Send className="w-16 h-16 text-tg-accent transform rotate-45 mb-6" />
        <h2 className="text-xl font-bold text-center">
          {t('splashOutsideTelegramTitle')}
        </h2>
        <p className="text-[14px] text-tg-hint text-center mt-3 leading-relaxed">
          {t('splashOutsideTelegramDesc')}
        </p>
        <div className="mt-8 w-full max-w-xs flex justify-center">
          <Button
            label={t('deviceLinkBtn')}
            icon={<LinkIcon className="w-4 h-4" />}
            onClick={() => {
              // Stub action for device link dialog
              alert('Link device feature: to be implemented');
            }}
          />
        </div>
      </div>
    );
  }

  // Failed state
  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-tg-bg text-tg-text px-8">
      <AlertCircle className="w-16 h-16 text-tg-destructive mb-6 animate-pulse" />
      <h2 className="text-xl font-bold text-center">
        {t('splashAuthErrorTitle')}
      </h2>
      <p className="text-[14px] text-tg-hint text-center mt-3 leading-relaxed">
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
